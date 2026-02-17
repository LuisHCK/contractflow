import { DATE_FORMAT } from '@/config/constants'
import { format, parse } from 'date-fns'

/**
 * Converts a date string in `yyyy-MM-dd` format to an ISO-like string (`yyyy-MM-dd'T'HH:mm:ss`).
 *
 * @param {string} date - The date string to format, in `yyyy-MM-dd` format.
 * @returns {string|null} The formatted ISO-like date-time string, or `null` if input is invalid.
 */
export const formatToISOString = (date) => {
    if (!date || typeof date !== 'string') return null

    const parsedDate =  parse(date, 'yyyy-MM-dd', new Date())
    return format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss")
}

/**
 * Formats a given date using the specified date format.
 *
 * @param {Date|string|number} date - The date to format. Can be a Date object, a date string, or a timestamp.
 * @returns {string|null} The formatted date string, or null if no date is provided.
 */
export const formatDate = (date) => {
    if (!date) return null

    return format(date, DATE_FORMAT)
}
