import { database } from '@/database'
import { CONTRACTORS } from '@/database/queries'

export const getAll = async () => {
    try {
        const rows = await database.unsafe(CONTRACTORS.GET_ALL)
        return rows
    } catch (error) {
        console.error(`Error fetching contractors: ${error.message}`)
        return []
    }
}

export const getById = async (id) => {
    try {
        const rows = await database.unsafe(CONTRACTORS.GET, [id])
        return rows?.[0] || null
    } catch (error) {
        console.error(`Error fetching contractor: ${error.message}`)
        return null
    }
}

export const create = async (contractor) => {
    try {
        const rows = await database.unsafe(CONTRACTORS.ADD, [
            contractor.name,
            contractor.email,
            contractor.phone,
            contractor.address
        ])
        const id = rows?.[0]?.id
        if (!id) return null
        return { ...contractor, id }
    } catch (error) {
        console.error(`Error creating contractor: ${error.message}`)
        return null
    }
}

export const update = async (id, contractor) => {
    try {
        await database.unsafe(CONTRACTORS.UPDATE, [
            contractor.name,
            contractor.email,
            contractor.phone,
            contractor.address,
            id
        ])
        return { ...contractor, id }
    } catch (error) {
        console.error(`Error updating contractor: ${error.message}`)
        return null
    }
}

export const getProjects = async (id) => {
    try {
        const rows = await database.unsafe(CONTRACTORS.PROJECTS, [id])
        return rows
    } catch (error) {
        console.error(`Error fetching contractor projects: ${error.message}`)
        return []
    }
}
