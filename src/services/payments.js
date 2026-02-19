/**
 * Recover a soft-deleted payment by setting its deleted flag to 0.
 * @param {string|number} paymentId - The unique identifier of the payment.
 * @returns {Promise<boolean>} True if a row was updated, false otherwise.
 */
export const recoverPaymentById = async (paymentId) => {
    try {
        const existing = await getById(paymentId)
        if (!existing?.id) return false
        await database.unsafe(PAYMENTS.RECOVER, [paymentId])
        return true
    } catch (error) {
        console.error(`Error recovering payment: ${error.message}`)
        return false
    }
}
import { database } from '@/database'
import { PAYMENTS, PROJECTS } from '@/database/queries'
import { getById as getContractorById } from './contractors'
import { getById as getPaymentCategoryById } from './payment-categories'
import { getAll as getEvidences } from './evidences'
import { format } from 'date-fns'
import { DATE_FORMAT } from '@/config/constants'
import { Project } from '@/database/models'
import { getStageById } from './stages'
import { formatToISOString } from '@/utils/date'
import {
    formatToCurrency,
    fromBaseAmount,
    getCurrencyOptions,
    normalizeExchangeRate,
    toBaseAmount
} from '@/utils/money'

export class Payment {
    constructor(payment) {
        this.id = payment.id
        /** @type {number} */
        this.stageId = payment.stageId || payment.stage_id
        /** @type {number} */
        this.amount = payment.amount
        this.amountBase = Number(payment.amountBase || payment.amount_base || 0)
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
        this.balance = Number(payment.balance || 0)
        this.balanceBase = Number(payment.balanceBase || payment.balance_base || 0)
        this.exchangeRate = normalizeExchangeRate(payment.exchangeRate || payment.exchange_rate || 1)
        this.displayCurrencyCode = payment.displayCurrencyCode || payment.display_currency_code || null
        this.displayCurrencySymbol = payment.displayCurrencySymbol || payment.display_currency_symbol || null
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
        const payments = await database.unsafe(PAYMENTS.GET_ALL, [stageId])

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
        const rows = await database.unsafe(PAYMENTS.GET, [paymentId])
        const payment = rows?.[0]
        return payment ? new Payment(payment) : null
    } catch (error) {
        console.error(`Error fetching payment by ID: ${error.message}`)
        return null
    }
}

export const getPaymentsByProjectId = async (projectId) => {
    try {
        const rows = await database.unsafe(PAYMENTS.GET_ALL_BY_PROJECT_ID, [projectId])
        return rows.map((row) => new Payment(row))
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
        const stage = await getStageById(payment.stageId)
        if (!stage?.id) return null

        const paymentExchangeRate = normalizeExchangeRate(stage.exchangeRate || 1)
        const paymentAmount = Number(payment.amount || 0)
        const amountBase = toBaseAmount(paymentAmount, paymentExchangeRate)

        const previousPayments = await getAllPayments(payment.stageId)
        const overallPaidAmountBase = previousPayments.reduce(
            (sum, p) =>
                Number(sum) +
                Number(
                    p.amountBase ||
                        toBaseAmount(p.amount, p.exchangeRate || paymentExchangeRate)
                ),
            0
        )
        const currentPaidAmountBase = overallPaidAmountBase + amountBase
        const estimatedCostBase = Number(
            stage.estimatedCostBase || toBaseAmount(stage.estimatedCost, stage.exchangeRate)
        )
        const balanceBase = estimatedCostBase - currentPaidAmountBase
        const balance = fromBaseAmount(balanceBase, paymentExchangeRate)

        const rows = await database.unsafe(PAYMENTS.ADD, [
            payment.stageId,
            paymentAmount,
            formatToISOString(payment.date),
            payment.payer,
            payment.paymentCategoryId,
            payment.contractorId,
            payment.description,
            payment.paymentMethod,
            payment.createdBy,
            balance,
            payment.hideTotalsInvoice,
            stage.displayCurrencyCode || 'USD',
            stage.displayCurrencySymbol || null,
            paymentExchangeRate,
            amountBase,
            balanceBase
        ])
        const id = rows?.[0]?.id
        if (!id) return null
        return new Payment({
            ...payment,
            id,
            amount: paymentAmount,
            amountBase,
            balance,
            balanceBase,
            exchangeRate: paymentExchangeRate,
            displayCurrencyCode: stage.displayCurrencyCode || 'USD',
            displayCurrencySymbol: stage.displayCurrencySymbol || null
        })
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
        const rows = await database.unsafe(PAYMENTS.GET_PROJECT_ID, [paymentId])
        const projectId = rows?.[0]?.project_id
        if (!projectId) return null
        if (asObject) {
            const prow = await database.unsafe(PROJECTS.GET, [projectId])
            return prow?.[0] ? new Project(prow[0]) : null
        }
        return projectId
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
        const rows = await database.unsafe(PAYMENTS.GET_STAGE_ID, [paymentId])
        return rows?.[0]?.stage_id || null
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
        const rows = await database.unsafe(PAYMENTS.GET_TOTAL_PAYED_AMOUNT, [stageId])
        return rows?.[0]?.total_amount || 0
    } catch (error) {
        console.error(`Error fetching total payed amount: ${error.message}`)
        return 0
    }
}

export const getStagePaymentsForReport = async (stageId) => {
    try {
        const rows = await database.unsafe(PAYMENTS.REPORT_BY_STAGE, [stageId])

        return rows.map((row) => {
            const rawDate = row.date || row.created_at
            const parsedDate = rawDate ? new Date(rawDate) : null
            const date = parsedDate && !Number.isNaN(parsedDate.getTime())
                ? format(parsedDate, DATE_FORMAT)
                : rawDate

            return {
                id: row.id,
                paymentNumber: row.id.toString().padStart(6, '0'),
                amount: Number(row.amount || 0),
                amountBase: Number(row.amount_base || 0),
                paymentMethod: row.payment_method,
                description: row.description,
                payer: row.payer,
                balance: Number(row.balance || 0),
                balanceBase: Number(row.balance_base || 0),
                exchangeRate: normalizeExchangeRate(row.exchange_rate || 1),
                displayCurrencyCode: row.display_currency_code || 'USD',
                displayCurrencySymbol: row.display_currency_symbol || null,
                formattedAmount: formatToCurrency(Number(row.amount || 0), getCurrencyOptions(row)),
                formattedBalance: formatToCurrency(Number(row.balance || 0), getCurrencyOptions(row)),
                contractorName: row.contractor_name,
                paymentCategoryName: row.payment_category_name,
                date
            }
        })
    } catch (error) {
        console.error(`Error fetching payments for stage report: ${error.message}`)
        return []
    }
}

/**
 * Soft delete a payment by setting its deleted flag.
 * @param {string|number} paymentId - The unique identifier of the payment.
 * @returns {Promise<boolean>} True if a row was updated, false otherwise.
 */
export const deletePaymentById = async (paymentId) => {
    try {
        const existing = await getById(paymentId)
        if (!existing?.id) return false
        await database.unsafe(PAYMENTS.SOFT_DELETE, [paymentId])
        return true
    } catch (error) {
        console.error(`Error soft deleting payment: ${error.message}`)
        return false
    }
}
