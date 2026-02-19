import { database } from '@/database'
import { Project } from '@/database/models'
import { PROJECTS } from '@/database/queries'
import { formatToISOString } from '@/utils/date'
import { getSystemSetting } from '@/services/system-settings'
import {
    fromBaseAmount,
    normalizeExchangeRate
} from '@/utils/money'

const normalizeCurrencyCode = (value, fallback = 'USD') => {
    const code = String(value || fallback)
        .trim()
        .toUpperCase()
    return code || 'USD'
}

const normalizeCurrencySymbol = (value) => {
    const symbol = String(value || '').trim()
    return symbol || null
}

const hydrateProjectFinancials = (project, defaultCurrency = 'USD') => {
    const exchangeRate = normalizeExchangeRate(project.default_exchange_rate)
    const totalEstimatedBase = Number(project.total_estimated_base || 0)
    const actualCostBase = Number(project.actual_cost_base || 0)
    const currencyCode = normalizeCurrencyCode(project.currency_code, defaultCurrency)

    return {
        ...project,
        currency_code: currencyCode,
        default_exchange_rate: exchangeRate,
        total_estimated_base: totalEstimatedBase,
        actual_cost_base: actualCostBase,
        estimatedCost: fromBaseAmount(totalEstimatedBase, exchangeRate),
        actualCost: fromBaseAmount(actualCostBase, exchangeRate)
    }
}

/**
 * Get all existing projects
 * @returns {Promise<Project[]>}
 */
export const getAllProjects = async () => {
    try {
        const systemCurrency = await getSystemSetting('currency', 'USD')
        const projects = await database.unsafe(PROJECTS.GET_ALL)
        return projects.map((project) =>
            new Project(hydrateProjectFinancials(project, systemCurrency))
        )
    } catch (error) {
        console.error(`Error fetching projects: ${error.message}`)
        return []
    }
}

/**
 * Get project by id
 * @param {number} id Project id
 * @returns {Promise<Project> | null}
 */
export const getProjectById = async (id, deleted = false) => {
    try {
        const systemCurrency = await getSystemSetting('currency', 'USD')
        const deletedFlag = deleted ? 'true' : 'false'
        const rows = await database.unsafe(PROJECTS.GET, [id, deletedFlag])
        const project = rows?.[0]
        if (!project) return null
        return new Project(hydrateProjectFinancials(project, systemCurrency))
    } catch (error) {
        console.error(`Error fetching project: ${error.message}`)
        return null
    }
}

/**
 * Crete a new project
 * @param {Project} project
 * @returns {Promise<Project> | null}
 */
export const createProject = async (project = {}) => {
    try {
        const systemCurrency = await getSystemSetting('currency', 'USD')
        const currencyCode = normalizeCurrencyCode(project.currencyCode, systemCurrency)
        const currencySymbol = normalizeCurrencySymbol(project.currencySymbol)
        const defaultExchangeRate = normalizeExchangeRate(project.defaultExchangeRate)

        const rows = await database.unsafe(PROJECTS.ADD, [
            project.name,
            project.description,
            formatToISOString(project.startDate),
            formatToISOString(project.endDate),
            project.status,
            project.createdBy,
            currencyCode,
            currencySymbol,
            defaultExchangeRate
        ])
        const id = rows?.[0]?.id
        console.log(`Project created with id ${id}`)
        return {
            ...project,
            id,
            currencyCode,
            currencySymbol,
            defaultExchangeRate
        }
    } catch (error) {
        console.error(`Error creating project!: ${error}`)
        return null
    }
}

/**
 * Update project
 * @param {number} id Project id
 * @param {Project} project Project object
 * @returns {Promise<Project> | null}
 */
export const updateProject = async (id, project = {}) => {
    try {
        const existingProject = await getProjectById(id)
        const systemCurrency = await getSystemSetting('currency', 'USD')
        const currencyCode = normalizeCurrencyCode(
            project.currencyCode || existingProject?.currencyCode,
            systemCurrency
        )
        const currencySymbol =
            project.currencySymbol === undefined
                ? existingProject?.currencySymbol || null
                : normalizeCurrencySymbol(project.currencySymbol)
        const defaultExchangeRate = normalizeExchangeRate(
            project.defaultExchangeRate || existingProject?.defaultExchangeRate || 1
        )

        await database.unsafe(PROJECTS.UPDATE, [
            project.name,
            project.description,
            formatToISOString(project.startDate),
            formatToISOString(project.endDate),
            project.status,
            currencyCode,
            currencySymbol,
            defaultExchangeRate,
            id
        ])
        return new Project({
            ...project,
            id,
            currencyCode,
            currencySymbol,
            defaultExchangeRate
        })
    } catch (error) {
        console.error(`Error updating project: ${error.message}`)
        return null
    }
}

/**
 * Update only project currency fields.
 * @param {number} id Project id
 * @param {{currencyCode?: string; currencySymbol?: string; defaultExchangeRate?: number|string}} payload
 * @returns {Promise<Project | null>}
 */
export const updateProjectCurrency = async (id, payload = {}) => {
    try {
        const existingProject = await getProjectById(id)
        if (!existingProject?.id) return null

        const systemCurrency = await getSystemSetting('currency', 'USD')
        const currencyCode = normalizeCurrencyCode(
            payload.currencyCode || existingProject.currencyCode,
            systemCurrency
        )
        const currencySymbol =
            payload.currencySymbol === undefined
                ? existingProject.currencySymbol || null
                : normalizeCurrencySymbol(payload.currencySymbol)
        const defaultExchangeRate = normalizeExchangeRate(
            payload.defaultExchangeRate || existingProject.defaultExchangeRate || 1
        )

        await database.unsafe(PROJECTS.UPDATE_CURRENCY, [
            currencyCode,
            currencySymbol,
            defaultExchangeRate,
            id
        ])

        return new Project({
            ...existingProject,
            currencyCode,
            currencySymbol,
            defaultExchangeRate
        })
    } catch (error) {
        console.error(`Error updating project currency: ${error.message}`)
        return null
    }
}

/**
 * Soft delete a project by setting its deleted flag.
 * @param {number|string} id - The unique identifier of the project.
 * @returns {Promise<boolean>} True if a row was updated, false otherwise.
 */
export const deleteProjectById = async (id) => {
    try {
        const project = await getProjectById(id)
        if (!project) return false
        await database.unsafe(PROJECTS.SOFT_DELETE, [id])
        return true
    } catch (error) {
        console.error(`Error soft deleting project: ${error.message}`)
        return false
    }
}

/**
 * Recover a soft-deleted project by setting its deleted flag to 0.
 * @param {number|string} id - The unique identifier of the project.
 * @returns {Promise<boolean>} True if a row was updated, false otherwise.
 */
export const recoverProjectById = async (id) => {
    try {
        const project = await getProjectById(id, true)
        if (!project) return false
        await database.unsafe(PROJECTS.RECOVER, [id])
        return true
    } catch (error) {
        console.error(`Error recovering project: ${error.message}`)
        return false
    }
}
