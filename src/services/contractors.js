import { database } from '@/database'
import { CONTRACTORS } from '@/database/queries'

export const getAll = async () => {
    try {
        const query = database.query(CONTRACTORS.GET_ALL)
        const contractors = query.all()
        return contractors
    } catch (error) {
        console.error(`Error fetching contractors: ${error.message}`)
        return []
    }
}

export const getById = async (id) => {
    try {
        const query = database.query(CONTRACTORS.GET)
        const contractor = query.get({ id })
        return contractor
    } catch (error) {
        console.error(`Error fetching contractor: ${error.message}`)
        return null
    }
}

export const create = async (contractor) => {
    try {
        const query = database.query(CONTRACTORS.ADD)
        const { lastInsertRowid } = query.run(contractor)
        return { ...contractor, id: lastInsertRowid }
    } catch (error) {
        console.error(`Error creating contractor: ${error.message}`)
        return null
    }
}

export const update = async (id, contractor) => {
    try {
        const query = database.query(CONTRACTORS.UPDATE)
        query.run({ ...contractor, id })
        return { ...contractor, id }
    } catch (error) {
        console.error(`Error updating contractor: ${error.message}`)
        return null
    }
}

export const getProjects = async (id) => {
    try {
        const query = database.query(CONTRACTORS.PROJECTS)
        const projects = query.all({ id })
        return projects
    } catch (error) {
        console.error(`Error fetching contractor projects: ${error.message}`)
        return []
    }
}
