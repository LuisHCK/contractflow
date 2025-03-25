import { database } from '@/database'
import { PROJECTS } from '@/database/queries'

export class Project {
    constructor(project) {
        /** @type {number} */
        this.id = project.id
        /** @type {string} */
        this.name = project.name
        /** @type {string} */
        this.description = project.description
        /** @type {string} */
        this.startDate = project.startDate || project.start_date
        /** @type {string} */
        this.endDate = project.endDate || project.end_date
        /** @type {string} */
        this.status = project.status
        /** @type {number} */
        this.estimatedCost = project.estimatedCost || project.total_estimated_cost
        /** @type {number} */
        this.actualCost = project.actualCost || project.actual_cost
    }

    get statusLabel() {
        if (this.status) {
            return this.status.replace('_', ' ')
        }
    }
}

/**
 * Get all existing projects
 * @returns {Promise<Project[]>}
 */
export const getAllProjects = async () => {
    try {
        const query = database.query(PROJECTS.GET_ALL)
        const projects = query.all()
        return projects.map((project) => new Project(project))
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
export const getProjectById = async (id) => {
    try {
        const query = database.query(PROJECTS.GET)
        const project = query.get({ id })
        return new Project(project)
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
        const { name, description, startDate, endDate, status } = project
        database
        const query = database.query(PROJECTS.ADD)

        const { lastInsertRowid } = query.run({
            name,
            description,
            startDate,
            endDate,
            status
        })

        console.log(`Project created with id ${lastInsertRowid}`)
        return new Project({ ...project, id: lastInsertRowid })
    } catch (error) {
        console.error(`Error creating project: ${error.message}`)
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
        const { name, description, startDate = null, endDate = null, status } = project
        const query = database.query(PROJECTS.UPDATE)
        query.run({
            id,
            name,
            description,
            startDate,
            endDate,
            status
        })
        return new Project({ ...project, id })
    } catch (error) {
        console.error(`Error updating project: ${error.message}`)
        return null
    }
}
