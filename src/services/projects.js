import { database } from '@/database'
import { Project } from '@/database/models'
import { PROJECTS } from '@/database/queries'
import { formatToISOString } from '@/utils/date'

/**
 * Get all existing projects
 * @returns {Promise<Project[]>}
 */
export const getAllProjects = async () => {
    try {
        const projects = await database.unsafe(PROJECTS.GET_ALL)
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
        const rows = await database.unsafe(PROJECTS.GET, [id])
        const project = rows?.[0]
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
        const rows = await database.unsafe(PROJECTS.ADD, [
            project.name,
            project.description,
            formatToISOString(project.startDate),
            formatToISOString(project.endDate),
            project.status,
            project.createdBy
        ])
        const id = rows?.[0]?.id
        console.log(`Project created with id ${id}`)
        return { ...project, id }
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
        await database.unsafe(PROJECTS.UPDATE, [
            project.name,
            project.description,
            formatToISOString(project.startDate),
            formatToISOString(project.endDate),
            project.status,
            id
        ])
        return new Project({ ...project, id })
    } catch (error) {
        console.error(`Error updating project: ${error.message}`)
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
        const project = await getProjectById(id)
        if (!project) return false
        await database.unsafe(PROJECTS.RECOVER, [id])
        return true
    } catch (error) {
        console.error(`Error recovering project: ${error.message}`)
        return false
    }
}
