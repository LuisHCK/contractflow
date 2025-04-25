import { database } from '@/database'
import { PAYMENTS } from '@/database/queries'
import { getById as getContractorById } from './contractors'
import { getById as getPaymentCategoryById } from './payment-categories'
import { format } from 'date-fns'
import { DATE_FORMAT } from '@/config/constants'

export class Payment {
    constructor(payment) {
        this.id = payment.id
        this.stageId = payment.stageId || payment.stage_id
        this.amount = payment.amount
        this.date = payment.date
        this.payer = payment.payer
        this.paymentCategoryId = payment.paymentCategoryId || payment.payment_category_id
        this.contractor = payment.contractor
        this.description = payment.description
        this.paymentMethod = payment.paymentMethod || payment.payment_method
        this.paymentCategory = payment.paymentCategory
        this.createdBy = payment.createdBy || payment.created_by
        this._createdAt = payment.createdAt || payment.created_at
        this._updatedAt = payment.updatedAt || payment.updated_at
    }

    /**
     * Get Payment number
     * @description
     * This is a unique identifier for the payment.
     * It is typically the same as the payment ID masked with a prefix.
     * @returns {string}
     */
    get paymentNumber() {
        return this.id.toString().padStart(6, '0')
    }

    get createdAt() {
        return format(this._createdAt, DATE_FORMAT)
    }

    get updatedAt() {
        return format(this._updatedAt, DATE_FORMAT)
    }
}

/**
 * Get all payments by stage id
 * @param {number} stageId Stage id
 * @returns {Promise<Payment[]>}
 */
/**
 * Retrieves all payments for a given stage ID, with an option to include related contractor data.
 *
 * @async
 * @function
 * @param {number} stageId - The ID of the stage for which payments are being retrieved.
 * @param {Object} options - Additional options for the query.
 * @param {boolean} [options.includeRelated=false] - Whether to include related contractor data in the payments.
 * @returns {Promise<Payment[]>} A promise that resolves to an array of Payment instances.
 * @throws {Error} Logs an error message and returns an empty array if an error occurs during the query.
 */
/**
 * Retrieves all payments for a given stage ID, with an option to include related data.
 *
 * @async
 * @function
 * @param {number} stageId - The ID of the stage for which payments are being retrieved.
 * @param {Object} [options] - Additional options for the query.
 * @param {boolean} [options.includeRelated=false] - Whether to include related data (e.g., contractor information).
 * @returns {Promise<Payment[]>} A promise that resolves to an array of Payment instances.
 * @throws {Error} Logs and returns an empty array if an error occurs during the operation.
 */
export const getAllPayments = async (stageId, options = { includeRelated: false }) => {
    try {
        const query = database.query(PAYMENTS.GET_ALL)
        const payments = query.all({
            stageId
        })

        // Include related data if specified
        if (options.includeRelated) {
            await Promise.all([
                payments.forEach(async (payment) => {
                    const contractor = await getContractorById(payment.contractor_id)
                    const paymentCategory = await getPaymentCategoryById(
                        payment.payment_category_id
                    )

                    if (contractor) {
                        payment.contractor = contractor
                    }

                    if (paymentCategory) {
                        payment.paymentCategory = paymentCategory
                    }
                })
            ])
        }

        // Map payments to Payment class instances
        return payments.map((payment) => new Payment(payment))
    } catch (error) {
        console.error(`Error fetching payments: ${error}`)
        return []
    }
}

export const getPaymentsByProjectId = async (projectId) => {
    try {
        const query = database.query(PAYMENTS.GET_ALL_BY_PROJECT_ID).as(Payment)
        const payments = query.all({
            projectId
        })
        return payments
    } catch (error) {
        console.error(`Error fetching payments: ${error.message}`)
        return []
    }
}

/**
 * Register new payment
 * @param {Omit<Payment, 'id'>} payment Payment object
 * @returns {Promise<Payment> | null}
 */
export const createPayment = async (payment = {}) => {
    try {
        const query = database.query(PAYMENTS.ADD)
        const { lastInsertRowid } = query.run({ ...payment })
        return new Payment({ ...payment, id: lastInsertRowid })
    } catch (error) {
        console.error(`Error creating payment: ${error.message}`)
        return null
    }
}

/**
 * Retrieves the project associated with a specific payment ID from the database.
 *
 * @async
 * @param {number | string} paymentId - The ID of the payment to retrieve the project for.
 * @returns {Promise<object|null>} A promise that resolves to the project object if found, or null if an error occurs or the project is not found.
 */
export const getPaymentProject = async (paymentId) => {
    try {
        const query = database.query(PAYMENTS.GET_PROJECT_ID)
        const { project_id } = query.get({ paymentId })
        return project_id
    } catch (error) {
        console.error(`Error fetching payment project: ${error.message}`)
        return null
    }
}

/**
 * Retrieves the stage of a specific payment from the database.
 *
 * @async
 * @param {string|number} paymentId - The unique identifier of the payment.
 * @returns {Promise<object|null>} A promise that resolves to the payment stage object if found,
 * or null if an error occurs during the database query or if the payment is not found.
 * Logs an error message to the console if the database operation fails.
 */
export const getPaymentStage = async (paymentId) => {
    try {
        const query = database.query(PAYMENTS.GET_STAGE_ID)
        const { stage_id } = query.get({ paymentId })
        return stage_id
    } catch (error) {
        console.error(`Error fetching payment stage: ${error.message}`)
        return null
    }
}
