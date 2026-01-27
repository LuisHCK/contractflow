import { database } from '@/database'
import { EVIDENCES } from '@/database/queries'

export class Evidence {
    constructor(evidence) {
        this.id = evidence.id
        this.name = evidence.name
        this.description = evidence.description
        this.filePath = evidence.file_path || evidence.filePath
        this.createdAt = evidence.created_at || evidence.createdAt
        this.updatedAt = evidence.updated_at || evidence.updatedAt
    }

    get fileName() {
        return this.filePath.split('/').pop()
    }
}

/**
 * Get all evidences for a specific payment
 * @param {number} paymentId Payment ID
 * @returns {Promise<Evidence[]>}
 */
export const getAll = async (paymentId) => {
    try {
        const rows = await database.unsafe(EVIDENCES.GET_ALL, [paymentId])
        return rows.map((evidence) => new Evidence(evidence))
    } catch (error) {
        console.error(`Error fetching evidences: ${error.message}`)
        return []
    }
}

/**
 * Add a new evidence
 * @param {Omit<Evidence, 'id'>} evidence Evidence object
 * @returns {Promise<Evidence | null>}
 */
export const create = async (evidence = {}) => {
    try {
        const rows = await database.unsafe(EVIDENCES.ADD, [
            evidence.paymentId,
            evidence.filePath ?? evidence.file_path,
            evidence.description,
            evidence.createdBy
        ])
        const id = rows?.[0]?.id
        if (!id) return null
        return new Evidence({ ...evidence, id })
    } catch (error) {
        console.error(`Error creating evidence: ${error.message}`)
        return null
    }
}

/**
 * Retrieves an evidence record by its ID.
 *
 * @async
 * @function getById
 * @param {string|number} id - The unique identifier of the evidence to retrieve.
 * @returns {Promise<Evidence|null>} A promise that resolves to an instance of the Evidence class if found, or null if not found or an error occurs.
 * @throws {Error} Logs an error message if an exception occurs during the query.
 */
export const getById = async (id) => {
    try {
        const rows = await database.unsafe(EVIDENCES.GET, [id])
        const evidence = rows?.[0]
        return evidence ? new Evidence(evidence) : null
    } catch (error) {
        console.error(`Error fetching evidence by ID: ${error.message}`)
        return null
    }
}

/**
 * Update an evidence
 * @param {Evidence} evidence Evidence object
 * @returns {Promise<Evidence | null>}
 */
export const update = async (evidence) => {
    try {
        await database.unsafe('UPDATE evidences SET description = $1 WHERE id = $2', [
            evidence.description,
            evidence.id
        ])
        return new Evidence(evidence)
    } catch (error) {
        console.error(`Error updating evidence: ${error.message}`)
        return null
    }
}

/**
 * Retrieves the project ID associated with a given evidence ID.
 *
 * @async
 * @function getProjectId
 * @param {string} evidenceId - The ID of the evidence to fetch the project ID for.
 * @returns {Promise<string|null>} The project ID if found, or null if an error occurs.
 * @throws {Error} Logs an error message if the query fails.
 */
export const getProjectId = async (evidenceId) => {
    try {
        const rows = await database.unsafe(EVIDENCES.GET_PROJECT_ID, [evidenceId])
        return rows?.[0]?.project_id || null
    } catch (error) {
        console.error(`Error fetching project ID: ${error.message}`)
        return null
    }
}
/**
 * Retrieves the stage ID associated with a given evidence ID from the database.
 * Logs an error and returns null if the database query fails.
 * @async
 * @param {number|string} evidenceId - The ID of the evidence to query.
 * @returns {Promise<number|null>} A promise that resolves to the stage ID (number) if found, or null if an error occurs or the stage ID is not found.
 */
export const getStageId = async (evidenceId) => {
    try {
        const rows = await database.unsafe(EVIDENCES.GET_STAGE_ID, [evidenceId])
        return rows?.[0]?.stage_id || null
    } catch (error) {
        console.error(`Error fetching stage ID: ${error.message}`)
        return null
    }
}
