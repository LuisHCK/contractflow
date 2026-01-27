import { database } from '@/database'
import { SETTINGS } from '@/database/queries'
import { Setting } from '@/database/models'

/**
 * Get a single setting by key.
 * @param {string} key
 * @returns {Promise<Setting | null>}
 */
export const getSettingByKey = async (key) => {
    try {
        const rows = await database.unsafe(SETTINGS.GET, [key])
        const row = rows?.[0]
        return row ? new Setting(row) : null
    } catch (error) {
        console.error(`Error fetching setting by key: ${error.message}`)
        return null
    }
}

/**
 * Get all settings.
 * @param {{ activeOnly?: boolean }} [options]
 * @returns {Promise<Setting[]>}
 */
export const getAllSettings = async (options = {}) => {
    const { activeOnly = false } = options

    try {
        const sql = activeOnly ? SETTINGS.GET_ALL_ACTIVE : SETTINGS.GET_ALL
        const rows = await database.unsafe(sql)
        return rows.map((row) => new Setting(row))
    } catch (error) {
        console.error(`Error fetching settings: ${error.message}`)
        return []
    }
}

/**
 * Create or update a setting by key.
 * Uses an UPSERT on the key column.
 * @param {{ key: string; value: string; details?: string; active?: boolean; userId?: number }} payload
 * @returns {Promise<boolean>} True if the operation succeeded, false otherwise.
 */
export const setSetting = async (payload) => {
    const { key, value, details = '', active = true, userId } = payload

    if (!key) {
        throw new Error('Setting key is required')
    }

    try {
        await database.unsafe(SETTINGS.ADD_OR_UPDATE, [
            key,
            value,
            details,
            Boolean(active),
            userId ?? null
        ])
        return true
    } catch (error) {
        console.error(`Error setting setting value: ${error.message}`)
        return false
    }
}

/**
 * Update an existing setting by ID.
 * @param {number} id
 * @param {{ value?: string; details?: string; active?: boolean }} changes
 * @returns {Promise<Setting | null>}
 */
export const updateSettingById = async (id, changes = {}) => {
    const { value = null, details = '', active = true } = changes

    try {
        await database.unsafe(SETTINGS.UPDATE, [
            value,
            details,
            Boolean(active),
            id
        ])

        const updated = await getSettingById(id)
        return updated
    } catch (error) {
        console.error(`Error updating setting: ${error.message}`)
        return null
    }
}

/**
 * Get a setting by its ID.
 * @param {number} id
 * @returns {Promise<Setting | null>}
 */
export const getSettingById = async (id) => {
    try {
        const rows = await database.unsafe('SELECT * FROM settings WHERE id = $1', [id])
        const row = rows?.[0]
        return row ? new Setting(row) : null
    } catch (error) {
        console.error(`Error fetching setting by id: ${error.message}`)
        return null
    }
}

/**
 * Toggle a setting's active flag.
 * @param {number} id
 * @param {boolean} active
 * @returns {Promise<Setting | null>}
 */
export const toggleSettingActive = async (id, active) => {
    return updateSettingById(id, { active })
}
