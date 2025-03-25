import { database } from '@/database'
import { PAYMENTS } from '@/database/queries'

export class Payment {
    constructor(payment) {
        this.id = payment.id
        this.stageId = payment.stageId || payment.stage_id
        this.amount = payment.amount
        this.date = payment.date
        this.payer = payment.payer
        this.payee = payment.payee
    }
}

/**
 * Get all payments by stage id
 * @param {number} stageId Stage id
 * @returns {Promise<Payment[]>}
 */
export const getAllPayments = async (stageId) => {
    try {
        const query = database.query(PAYMENTS.GET_ALL).as(Payment)
        const payments = query.all({
            stageId
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
