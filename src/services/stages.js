import { database } from '@/database'
import { STAGES } from '@/database/queries'

export class Stage {
    constructor(stage) {
        this.id = stage.id
        this.projectId = stage.projectId || stage.project_id
        this.name = stage.name
        this.estimatedCost = stage.estimatedCost || stage.estimated_cost
        this.totalPayments = stage.totalPayments || stage.total_payments || 0
        this.progress = stage.progress || 0
    }
}

/**
 * Get stage by id
 * @param {Number} id Stage id
 * @returns {Promise<Stage>}
 */
export const getStageById = async (id) => {
    try {
        const query = database.query(STAGES.GET)
        const stage = query.get({ id })
        return new Stage(stage)
    } catch (error) {
        console.error(`Error fetching stage: ${error.message}`)
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
        const query = database.query(STAGES.GET_ALL)
        const stages = query.all({
            projectId
        })
        return stages.map((stage) => new Stage(stage))
    } catch (error) {
        console.error(`Error fetching stages: ${error.message}`)
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
        const query = database.query(STAGES.ADD)
        const { lastInsertRowid } = query.run({ ...stage })

        if (!lastInsertRowid) {
            return null
        }

        return new Stage({
            id: lastInsertRowid,
            ...stage
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
        const query = database.query(STAGES.UPDATE)
        const { changes } = query.run({ id, ...stage })

        if (!!changes) {
            return getStageById(id)
        }
        
        return null
    } catch (error) {
        console.error(`Error updating stage: ${error.message}`)
        return null
    }
}
