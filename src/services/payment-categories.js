import { database } from '@/database'
import { PAYMENT_CATEGORIES } from '@/database/queries'

export class PaymentCategory {
    constructor(category) {
        this.id = category.id
        this.name = category.name
        this.description = category.description
    }
}

/**
 * Get all payment categories
 * @returns {Promise<PaymentCategory[]>}
 */
export const getAll = async () => {
    try {
        const query = database.query(PAYMENT_CATEGORIES.GET_ALL).as(PaymentCategory)
        const categories = query.all()
        return categories
    } catch (error) {
        console.error(`Error fetching payment categories: ${error.message}`)
        return []
    }
}

/**
 * Get a payment category by ID
 * @param {number} id Payment category ID
 * @returns {Promise<PaymentCategory | null>}
 */
export const getById = async (id) => {
    try {
        const query = database.query(PAYMENT_CATEGORIES.GET)
        const category = query.get({ id })
        return category ? new PaymentCategory(category) : null
    } catch (error) {
        console.error(`Error fetching payment category: ${error.message}`)
        return null
    }
}

/**
 * Create a new payment category
 * @param {Omit<PaymentCategory, 'id'>} category Payment category object
 * @returns {Promise<PaymentCategory | null>}
 */
export const create = async (category = {}) => {
    try {
        const query = database.query(PAYMENT_CATEGORIES.ADD)
        const { lastInsertRowid } = query.run({ ...category })
        return new PaymentCategory({ ...category, id: lastInsertRowid })
    } catch (error) {
        console.error(`Error creating payment category: ${error.message}`)
        return null
    }
}

/**
 * Update a payment category
 * @param {number} id Payment category ID
 * @param {PaymentCategory} category Payment category object
 * @returns {Promise<PaymentCategory | null>}
 */
export const update = async (id, category = {}) => {
    try {
        const query = database.query(PAYMENT_CATEGORIES.UPDATE)
        query.run({ id, ...category })
        return new PaymentCategory({ ...category, id })
    } catch (error) {
        console.error(`Error updating payment category: ${error.message}`)
        return null
    }
}
