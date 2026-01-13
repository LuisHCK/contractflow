import { getSettingByKey, setSetting } from '@/services/settings'

/**
 * Read a system setting as a string, falling back to defaultValue if missing or inactive.
 * @param {string} key
 * @param {string | null} [defaultValue]
 * @returns {Promise<string | null>}
 */
export const getSystemSetting = async (key, defaultValue = null) => {
    const setting = await getSettingByKey(key)

    if (!setting || !setting.active) {
        return defaultValue
    }

    return setting.value ?? defaultValue
}

/**
 * Read a system setting and coerce it to boolean.
 * Accepts "true"/"1" (case-insensitive) as true, "false"/"0" as false.
 * @param {string} key
 * @param {boolean} [defaultValue=false]
 * @returns {Promise<boolean>}
 */
export const getSystemSettingBoolean = async (key, defaultValue = false) => {
    const raw = await getSystemSetting(key, null)

    if (raw === null || raw === undefined) {
        return defaultValue
    }

    const normalized = String(raw).trim().toLowerCase()

    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false

    return defaultValue
}

/**
 * Read a system setting and parse it as JSON.
 * If parsing fails or value is missing, returns defaultValue.
 * @param {string} key
 * @param {any} [defaultValue=null]
 * @returns {Promise<any>}
 */
export const getSystemSettingJson = async (key, defaultValue = null) => {
    const raw = await getSystemSetting(key, null)

    if (raw === null || raw === undefined) {
        return defaultValue
    }

    try {
        return JSON.parse(raw)
    } catch {
        return defaultValue
    }
}

/**
 * Write or update a system setting.
 * This uses the generic settings service under the hood.
 * @param {string} key
 * @param {string} value - Raw string value to store
 * @param {{ details?: string; active?: boolean; userId?: number }} [options]
 * @returns {Promise<boolean>}
 */
export const setSystemSetting = async (key, value, options = {}) => {
    const { details, active, userId } = options
    return setSetting({ key, value, details, active, userId })
}

/**
 * Convenience helper to store a JSON-serializable value as JSON in settings.
 * @param {string} key
 * @param {any} value
 * @param {{ details?: string; active?: boolean; userId?: number }} [options]
 * @returns {Promise<boolean>}
 */
export const setSystemSettingJson = async (key, value, options = {}) => {
    const serialized = JSON.stringify(value)
    return setSystemSetting(key, serialized, options)
}
