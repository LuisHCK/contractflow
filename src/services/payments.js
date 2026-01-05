import { database } from '@/database'
import { PAYMENTS, PROJECTS } from '@/database/queries'
import { getById as getContractorById } from './contractors'
import { getById as getPaymentCategoryById } from './payment-categories'
import { getAll as getEvidences } from './evidences'
import { format } from 'date-fns'
import { DATE_FORMAT } from '@/config/constants'
import { Project } from '@/database/models'
import { getStageById } from './stages'

export class Payment {
    constructor(payment) {
        this.id = payment.id
        /** @type {number} */
        this.stageId = payment.stageId || payment.stage_id
        /** @type {number} */
        this.amount = payment.amount
        this.date = payment.date
        this.payer = payment.payer
        this.paymentCategoryId = payment.paymentCategoryId || payment.payment_category_id
        this.contractorId = payment.contractorId || payment.contractor_id
        this.description = payment.description
        this.paymentMethod = payment.paymentMethod || payment.payment_method
        this.paymentCategory = payment.paymentCategory
        this.createdBy = payment.createdBy || payment.created_by
        this._createdAt = payment.createdAt || payment.created_at
        this._updatedAt = payment.updatedAt || payment.updated_at
        this.evidences = payment.evidences || []
        this.contractor = payment.contractor || null
        this.balance = payment.balance || 0
        this.hideTotalsInvoice = payment.hideTotalsInvoice || payment.hide_totals_invoice || false
        this.deleted = Boolean(payment.deleted) || false
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
            await Promise.all(
                payments.map(async (payment) => {
                    const contractor = await getContractorById(payment.contractor_id)
                    const paymentCategory = await getPaymentCategoryById(
                        payment.payment_category_id
                    )
                    const evidences = await getEvidences(payment.id)

                    if (contractor) {
                        payment.contractor = contractor
                    }

                    if (paymentCategory) {
                        payment.paymentCategory = paymentCategory
                    }

                    if (evidences) {
                        payment.evidences = evidences
                    }
                })
            )
        }

        // Map payments to Payment class instances
        return payments.map((payment) => new Payment(payment))
    } catch (error) {
        console.error(`Error fetching payments: ${error}`)
        return []
    }
}

export const getById = async (paymentId) => {
    try {
        const query = database.query(PAYMENTS.GET)
        const payment = query.get({ id: paymentId })

        if (payment) {
            return new Payment(payment)
        }
        return null
    } catch (error) {
        console.error(`Error fetching payment by ID: ${error.message}`)
        return null
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
        // Calculate balance
        const stage = await getStageById(payment.stageId)
        // Get previous payments for the stage
        const previousPayments = await getAllPayments(payment.stageId)
        // Calculate the total amount already paid for the stage
        const overallPaidAmount = previousPayments.reduce(
            (sum, p) => Number(sum) + Number(p.amount),
            0
        )
        const currentPaidAmount = overallPaidAmount + Number(payment.amount)
        // Calculate the balance
        const balance = Number(stage.estimatedCost) - currentPaidAmount

        const query = database.query(PAYMENTS.ADD)
        const { lastInsertRowid } = query.run({ ...payment, balance })
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
export const getPaymentProject = async (paymentId, asObject = false) => {
    try {
        if (asObject) {
            const projectQuery = database.query(PROJECTS.GET).as(Project)
            const project = projectQuery.get({ id: project.id })
            return project
        } else {
            const query = database.query(PAYMENTS.GET_PROJECT_ID)
            const project = query.get({ paymentId })
            return project.project_id
        }
    } catch (error) {
        console.error(`Error fetching payment project: ${error.message}`, error)
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
        const stage = query.get({ paymentId })
        return stage?.stage_id
    } catch (error) {
        console.error(`Error fetching payment stage: ${error.message}`)
        return null
    }
}

/**
 * Retrieves the total amount paid for a specific stage.
 *
 * @async
 * @function
 * @param {string|number} stageId - The unique identifier of the stage.
 * @returns {Promise<number>} The total amount paid for the given stage, or 0 if an error occurs or no payments are found.
 */
export const getTotalPayedAmount = async (stageId) => {
    try {
        const query = database.query(PAYMENTS.GET_TOTAL_PAYED_AMOUNT)
        const { total } = query.get({ stageId })
        return total || 0
    } catch (error) {
        console.error(`Error fetching total payed amount: ${error.message}`)
        return 0
    }
}

/**
 * Soft delete a payment by setting its deleted flag.
 * @param {string|number} paymentId - The unique identifier of the payment.
 * @returns {Promise<boolean>} True if a row was updated, false otherwise.
 */
export const deletePaymentById = async (paymentId) => {
    try {
        const query = database.query(PAYMENTS.SOFT_DELETE)
        const result = query.run({ id: paymentId })
        return result.changes > 0
    } catch (error) {
        console.error(`Error soft deleting payment: ${error.message}`)
        return false
    }
}
