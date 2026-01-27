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
        const rows = await database.unsafe(PAYMENT_CATEGORIES.GET_ALL)
        return rows.map((row) => new PaymentCategory(row))
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
        const rows = await database.unsafe(PAYMENT_CATEGORIES.GET, [id])
        const category = rows?.[0]
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
        const rows = await database.unsafe(PAYMENT_CATEGORIES.ADD, [
            category.name,
            category.description
        ])
        const id = rows?.[0]?.id
        if (!id) return null
        return new PaymentCategory({ ...category, id })
    } catch (error) {
        console.error(`Error creating payment category: ${error.message}`)
        return null
    }
}

export const createOrUpdate = async (category = {}) => {
    try {
        await database.unsafe(PAYMENT_CATEGORIES.ADD_OR_UPDATE, [
            category.name,
            category.description
        ])
        const rows = await database.unsafe('SELECT id, name, description FROM payment_categories WHERE name = $1', [category.name])
        const found = rows?.[0]
        return found ? new PaymentCategory(found) : null
    } catch (error) {
        console.error(`Error creating or updating payment category: ${error.message}`)
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
        await database.unsafe(PAYMENT_CATEGORIES.UPDATE, [
            category.name,
            category.description,
            id
        ])
        return new PaymentCategory({ ...category, id })
    } catch (error) {
        console.error(`Error updating payment category: ${error.message}`)
        return null
    }
}

/**
 * Seeds the database with a predefined list of payment categories.
 * Each category includes a name and description.
 *
 * @async
 * @function
 * @returns {Promise<void>} Resolves when all categories have been created.
 */
export const seedPaymentCategories = async () => {
    try {
        const categories = [
            {
                name: 'Labor',
                description: 'Payments for construction workers, subcontractors, and skilled labor'
            },
            {
                name: 'Materials',
                description:
                    'Payments related to construction materials such as cement, steel, and bricks'
            },
            {
                name: 'Equipment Rental',
                description: 'Payments for renting construction equipment and machinery'
            },
            {
                name: 'Permits & Fees',
                description: 'Payments for government permits, licenses, and inspection fees'
            },
            {
                name: 'Site Utilities',
                description:
                    'Payments for temporary utilities like water, electricity, and sanitation on site'
            }
        ]

        for (const category of categories) {
            await createOrUpdate(category)
        }

        console.info('Payment categories seeded successfully.')
    } catch (error) {
        console.error(`Error seeding payment categories: ${error.message}`)
    }
}
