import { database } from '@/database'
import { STAGES } from '@/database/queries'
import { formatToCurrency } from '@/utils/money'
import { format } from 'date-fns'
import { DATE_FORMAT } from '@/config/constants'
import { formatToISOString } from '@/utils/date'

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
        this.totalPayments = stage.totalPayments || stage.total_payments || 0
        this.contractorId = stage.contractorId || stage.contractor_idW
        this.progress = stage.progress || 0
        this.createdAt = stage.createdAt || stage.created_at
        this.updatedAt = stage.updatedAt || stage.updated_at
        this.createdBy = stage.createdBy || stage.created_by
        this.updatedBy = stage.updatedBy || stage.updated_by
        this.deleted = Boolean(stage.deleted) || false
        Object.assign(this, stage)
    }

    get formattedEstimatedCost() {
        return formatToCurrency(this.estimatedCost)
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
        return new Stage(stage)
    } catch (error) {
        console.error(`Error fetching stage by id: ${error.message}`)
        return {}
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
        const rows = await database.unsafe(STAGES.ADD, [
            stage.projectId,
            stage.name,
            stage.estimatedCost,
            stage.createdBy,
            formatToISOString(stage.startDate),
            formatToISOString(stage.endDate),
            stage.description,
            stage.contractorId
        ])
        const id = rows?.[0]?.id
        if (!id) return null
        return new Stage({ id, ...stage })
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
        const rows = await database.unsafe(STAGES.UPDATE, [
            stage.name,
            stage.estimatedCost,
            formatToISOString(stage.startDate),
            formatToISOString(stage.endDate),
            stage.description,
            stage.contractorId,
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

        const estimatedCost = Number(summary.estimated_cost) || 0
        const totalPaid = Number(summary.total_paid) || 0
        const outstandingBalance = Number(summary.outstanding_balance) || 0
        const progress = Number(summary.progress_percentage) || 0

        return {
            project: {
                id: summary.project_id,
                name: summary.project_name,
                status: summary.project_status,
                description: summary.project_description
            },
            stage: {
                id: summary.stage_id,
                name: summary.stage_name,
                description: summary.stage_description,
                estimatedCost,
                formattedEstimatedCost: formatToCurrency(estimatedCost),
                startDate: formatDateValue(summary.stage_start_date),
                endDate: formatDateValue(summary.stage_end_date)
            },
            totals: {
                totalPaid,
                formattedTotalPaid: formatToCurrency(totalPaid),
                outstandingBalance,
                formattedOutstandingBalance: formatToCurrency(outstandingBalance),
                paymentsCount: summary.payments_count || 0,
                progress
            }
        }
    } catch (error) {
        console.error(`Error fetching stage report summary: ${error.message}`)
        return null
    }
}
