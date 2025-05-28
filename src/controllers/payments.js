import { PAYMENT_FORM } from '@/forms'
import { formatOptions, populateForm } from '@/forms/utils'
import {
    getPaymentsByProjectId,
    createPayment,
    getById,
    getPaymentProject
} from '@/services/payments'
import { getById as getContractorById } from '@/services/contractors'
import { getAll as getAllPaymentCategories } from '@/services/payment-categories'
import { getAll as getAllContractors } from '@/services/contractors'
import { format } from 'date-fns'
import { DATE_FORMAT } from '@/config/constants'
import { getStageById } from '@/services/stages'
import numberToWords from '@/utils/number-to-words'
import { formatToCurrency } from '@/utils/money'

/**
 * Handles the request to list all payments for a specific project stage.
 * Fetches payments, formats data for table view, and renders the list view template.
 *
 * @async
 * @function index
 * @param {import('express').Request} req - Express request object, expects `params.id` and `params.stageId`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Renders the payments list view or sends a 500 error response on failure.
 */
export const index = async (req, res) => {
    try {
        const projectPayments = await getPaymentsByProjectId()

        // Customize table view
        const data = projectPayments.map((payment) => ({
            ...payment,
            date: format(payment.date, DATE_FORMAT),
            amount: () => `<span class="tag is-primary">$${payment.amount.toFixed(2)}</span>`,
            actions: () =>
                `<a href="/projects/show/${req.params.id}/stages/${req.params.stageId}/payments/show/${payment.id}" class="button is-small">View</a>`
        }))

        const fields = PAYMENT_FORM.fields.map((field) => field.name)
        fields.push('actions')

        res.render('generic/list-view', {
            data,
            fields,
            title: `Payments for stage: ${stage.name}`
        })
    } catch (error) {
        console.error(`Error fetching projects: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching projects. Please try again later.')
    }
}

/**
 * Handles the creation of a stage payment.
 * 
 * - On POST requests, attempts to create a payment for a specific stage and redirects based on success.
 * - On GET requests, renders a form for creating a new payment, populating contractor and payment category options.
 * 
 * @async
 * @function
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const createStagePayment = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            const stage = await createPayment({ ...body, stageId: params.stageId, createdBy: 1 })

            if (stage?.id) {
                res.redirect(`/projects/show/${params.id}/stages/show/${params.stageId}`)
            } else {
                res.redirect(
                    `/projects/show/${params.id}/stages/show/${params.stageId}/payments/create`
                )
            }
            return
        }

        // GET handling
        const contractors = await getAllContractors()
        const paymentCategories = await getAllPaymentCategories()

        const contractorsOptions = formatOptions({
            items: contractors
        })

        const paymentCategoriesOptions = formatOptions({
            items: paymentCategories
        })

        const form = populateForm({
            form: PAYMENT_FORM,
            data: {
                ...req.body,
                contractorId: contractorsOptions,
                paymentCategoryId: paymentCategoriesOptions
            }
        })

        // Render form view
        return res.render('generic/form-view', { form, title: 'Register new payment' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const print = async (req, res) => {
    try {
        const { id } = req.params
        const payment = await getById(id)
        const contractor = await getContractorById(payment.contractorId)
        const stage = await getStageById(payment.stageId)
        const project = await getPaymentProject(id, true)

        if (!payment || !contractor || !stage || !project) {
            return res.status(404).send('Payment not found')
        }

        res.render('app/payments/invoice', {
            payment,
            contractor,
            project,
            stage: {
                ...stage,
                estimatedCostWords: numberToWords(payment.amount).toUpperCase()
            },
            utils: {
                formatToCurrency
            }
        })
    } catch (error) {
        console.error(`Error fetching payment: ${error}`)
        return res
            .status(500)
            .send('An error occurred while fetching the payment. Please try again later.')
    }
}
