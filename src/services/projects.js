import { database } from '@/database'
import { Project } from '@/database/models'
import { PROJECTS } from '@/database/queries'

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
        const query = database.query(PROJECTS.ADD)

        const { lastInsertRowid } = query.run(project)

        console.log(`Project created with id ${lastInsertRowid}`)

        return { ...project, id: lastInsertRowid }
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
        const query = database.query(PROJECTS.UPDATE)
        query.run({
            id,
            ...project
        })
        return new Project({ ...project, id })
    } catch (error) {
        console.error(`Error updating project: ${error.message}`)
        return null
    }
}
