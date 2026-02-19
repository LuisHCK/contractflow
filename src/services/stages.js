import { database } from '@/database'
import { STAGES } from '@/database/queries'
import {
    formatToCurrency,
    fromBaseAmount,
    getCurrencyOptions,
    normalizeExchangeRate,
    toBaseAmount
} from '@/utils/money'
import { format } from 'date-fns'
import { DATE_FORMAT } from '@/config/constants'
import { formatToISOString } from '@/utils/date'
import { getProjectById } from '@/services/projects'

/**
 * Recover a soft-deleted stage by setting its deleted flag to 0.
 * @param {number|string} stageId - The unique identifier of the stage.
 * @returns {Promise<boolean>} True if a row was updated, false otherwise.
 */
export const recoverStageById = async (stageId) => {
    try {
        const existing = await getStageById(stageId)
        if (!existing?.id) return false
        await database.unsafe(STAGES.RECOVER, [stageId])
        return true
    } catch (error) {
        console.error(`Error recovering stage: ${error.message}`)
        return false
    }
}

export class Stage {
    constructor(stage) {
        this.id = stage.id
        this.projectId = stage.projectId || stage.project_id
        this.name = stage.name
        this.estimatedCost = stage.estimatedCost || stage.estimated_cost || 0
        this.estimatedCostBase = stage.estimatedCostBase || stage.estimated_cost_base || 0
        this.totalPayments = stage.totalPayments || stage.total_payments || 0
        this.totalPaymentsBase = stage.totalPaymentsBase || stage.total_payments_base || 0
        this.displayCurrencyCode = stage.displayCurrencyCode || stage.display_currency_code || null
        this.displayCurrencySymbol = stage.displayCurrencySymbol || stage.display_currency_symbol || null
        this.exchangeRate = normalizeExchangeRate(stage.exchangeRate || stage.exchange_rate || 1)
        this.contractorId = stage.contractorId || stage.contractor_id
        this.progress = stage.progress || 0
        this.createdAt = stage.createdAt || stage.created_at
        this.updatedAt = stage.updatedAt || stage.updated_at
        this.createdBy = stage.createdBy || stage.created_by
        this.updatedBy = stage.updatedBy || stage.updated_by
        this.deleted = Boolean(stage.deleted) || false
        Object.assign(this, stage)
    }

    get formattedEstimatedCost() {
        return formatToCurrency(this.estimatedCost, {
            currency: this.displayCurrencyCode,
            symbol: this.displayCurrencySymbol
        })
    }
}

const resolveProjectCurrencyContext = async (projectId) => {
    const project = await getProjectById(projectId)
    if (!project?.id) {
        return {
            currencyCode: 'USD',
            currencySymbol: null,
            exchangeRate: 1
        }
    }

    return {
        currencyCode: project.currencyCode || 'USD',
        currencySymbol: project.currencySymbol || null,
        exchangeRate: normalizeExchangeRate(project.defaultExchangeRate || 1)
    }
}

const formatDateValue = (value) => {
    if (!value) {
        return null
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return format(date, DATE_FORMAT)
}

/**
 * Get stage by id
 * @param {Number} id Stage id
 * @returns {Promise<Stage>}
 */
export const getStageById = async (id) => {
    try {
        const rows = await database.unsafe(STAGES.GET, [id])
        const stage = rows?.[0]
        if (!stage) return null
        return new Stage(stage)
    } catch (error) {
        console.error(`Error fetching stage by id: ${error.message}`)
        return null
    }
}

/**
 * Get all stages by project
 * @param {number} projectId
 * @returns {Promise<Stage[]>}
 
 */
export const getStagesByProject = async (projectId) => {
    try {
        const stages = await database.unsafe(STAGES.GET_ALL, [projectId])
        return stages.map((stage) => new Stage(stage))
    } catch (error) {
        console.error(`Error fetching stages by project: ${error.message}`)
        return []
    }
}

/**
 * Create a new stage
 * @param {Omit<Stage, 'id'>} stage Stage object
 * @returns {Promise<Stage | null>}
 */
export const createStage = async (stage) => {
    try {
        const projectCurrency = await resolveProjectCurrencyContext(stage.projectId)
        const estimatedCost = Number(stage.estimatedCost || 0)
        const estimatedCostBase = toBaseAmount(estimatedCost, projectCurrency.exchangeRate)

        const rows = await database.unsafe(STAGES.ADD, [
            stage.projectId,
            stage.name,
            estimatedCost,
            stage.createdBy,
            formatToISOString(stage.startDate),
            formatToISOString(stage.endDate),
            stage.description,
            stage.contractorId,
            projectCurrency.currencyCode,
            projectCurrency.currencySymbol,
            projectCurrency.exchangeRate,
            estimatedCostBase
        ])
        const id = rows?.[0]?.id
        if (!id) return null
        return new Stage({
            id,
            ...stage,
            estimatedCost,
            estimatedCostBase,
            displayCurrencyCode: projectCurrency.currencyCode,
            displayCurrencySymbol: projectCurrency.currencySymbol,
            exchangeRate: projectCurrency.exchangeRate
        })
    } catch (error) {
        console.error(`Error creating stage: ${error.message}`)
        return null
    }
}

/**
 * Update stage
 * @param {number} id Stage id
 * @param {Stage} stage Stage object
 * @returns {Promise<Stage | null>}
 */
export const updateStage = async (id, stage) => {
    try {
        const existingStage = await getStageById(id)
        if (!existingStage?.id) return null

        const projectCurrency = await resolveProjectCurrencyContext(existingStage.projectId)
        const estimatedCost = Number(stage.estimatedCost || 0)
        const estimatedCostBase = toBaseAmount(estimatedCost, projectCurrency.exchangeRate)

        const rows = await database.unsafe(STAGES.UPDATE, [
            stage.name,
            estimatedCost,
            formatToISOString(stage.startDate),
            formatToISOString(stage.endDate),
            stage.description,
            stage.contractorId,
            projectCurrency.currencyCode,
            projectCurrency.currencySymbol,
            projectCurrency.exchangeRate,
            estimatedCostBase,
            id
        ])
        if (!rows || rows.length === 0) return null
        return getStageById(id)
    } catch (error) {
        console.error(`Error updating stage: ${error.message}`)
        return null
    }
}

/**
 * Retrieves the project ID associated with a given stage ID from the database.
 *
 * @async
 * @function getProjectId
 * @param {number|string} stageId - The unique identifier of the stage.
 * @returns {Promise<number|string|null>} A promise that resolves with the project ID if found,
 * or null if an error occurs during the database query or if the stage ID doesn't correspond to a project.
 * Logs an error message to the console if the database operation fails.
 */
export const getProjectId = async (stageId) => {
    try {
        const rows = await database.unsafe(STAGES.GET_PROJECT_ID, [stageId])
        return rows?.[0]?.project_id || rows?.[0]?.projectId || null
    } catch (error) {
        console.error(`Error fetching project ID: ${error.message}`)
        return null
    }
}

/**
 * Soft delete a stage by setting its deleted flag.
 * @param {number|string} stageId - The unique identifier of the stage.
 * @returns {Promise<boolean>} True if a row was updated, false otherwise.
 */
export const deleteStageById = async (stageId) => {
    try {
        const stage = await getStageById(stageId)
        if (!stage?.id) return false
        await database.unsafe(STAGES.SOFT_DELETE, [stageId])
        return true
    } catch (error) {
        console.error(`Error soft deleting stage: ${error.message}`)
        return false
    }
}

export const getStageReportSummary = async (stageId) => {
    try {
        const rows = await database.unsafe(STAGES.REPORT_SUMMARY, [stageId])
        const summary = rows?.[0]

        if (!summary) {
            return null
        }

        const exchangeRate = normalizeExchangeRate(summary.stage_exchange_rate || 1)
        const stageCurrencyCode = summary.stage_currency_code || summary.project_currency_code || 'USD'
        const stageCurrencySymbol = summary.stage_currency_symbol || summary.project_currency_symbol || null
        const estimatedCostBase = Number(summary.estimated_cost_base) || 0
        const totalPaidBase = Number(summary.total_paid_base) || 0
        const outstandingBalanceBase = Number(summary.outstanding_balance_base) || 0
        const estimatedCost = fromBaseAmount(estimatedCostBase, exchangeRate)
        const totalPaid = fromBaseAmount(totalPaidBase, exchangeRate)
        const outstandingBalance = fromBaseAmount(outstandingBalanceBase, exchangeRate)
        const progress = Number(summary.progress_percentage) || 0
        const formatOptions = getCurrencyOptions({
            displayCurrencyCode: stageCurrencyCode,
            displayCurrencySymbol: stageCurrencySymbol,
            exchangeRate
        })

        return {
            project: {
                id: summary.project_id,
                name: summary.project_name,
                status: summary.project_status,
                description: summary.project_description,
                currencyCode: summary.project_currency_code,
                currencySymbol: summary.project_currency_symbol,
                defaultExchangeRate: summary.project_exchange_rate
            },
            stage: {
                id: summary.stage_id,
                name: summary.stage_name,
                description: summary.stage_description,
                estimatedCost,
                estimatedCostBase,
                exchangeRate,
                displayCurrencyCode: stageCurrencyCode,
                displayCurrencySymbol: stageCurrencySymbol,
                formattedEstimatedCost: formatToCurrency(estimatedCost, formatOptions),
                startDate: formatDateValue(summary.stage_start_date),
                endDate: formatDateValue(summary.stage_end_date)
            },
            totals: {
                totalPaid,
                totalPaidBase,
                formattedTotalPaid: formatToCurrency(totalPaid, formatOptions),
                outstandingBalance,
                outstandingBalanceBase,
                formattedOutstandingBalance: formatToCurrency(outstandingBalance, formatOptions),
                paymentsCount: summary.payments_count || 0,
                progress
            }
        }
    } catch (error) {
        console.error(`Error fetching stage report summary: ${error.message}`)
        return null
    }
}
