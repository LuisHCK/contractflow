import { PAYMENT_FORM } from '@/forms'
import { formatOptions, populateForm } from '@/forms/utils'
import {
    getAllPayments,
    createPayment,
    getById,
    getPaymentProject,
    deletePaymentById
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
        const { id: projectId, stageId } = req.params
        const stage = await getStageById(stageId)

        const payments = await getAllPayments(stageId)

        const data = payments.map((payment) => ({
            ...payment,
            date: format(payment.date, DATE_FORMAT),
            amount: () =>
                `<span class="tag is-primary">${formatToCurrency(payment.amount, {
                    currency: payment.displayCurrencyCode,
                    symbol: payment.displayCurrencySymbol
                })}</span>`,
            actions: () =>
                `<a href="/projects/show/${projectId}/stages/${stageId}/payments/show/${payment.id}" class="button is-small">${req.__('view')}</a>`
        }))

        const fields = PAYMENT_FORM.fields.map((field) => field.name)
        fields.push('actions')

        res.render('generic/table-view', {
            data,
            fields,
            title: req.__('payments_stage_title', { name: stage.name })
        })
    } catch (error) {
        console.error(`Error fetching payments: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching payments. Please try again later.')
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
            const hideTotalsInvoice = body.hideTotalsInvoice === 'on'
            const payment = await createPayment({
                ...body,
                stageId: params.stageId,
                hideTotalsInvoice,
                createdBy: req.user.id
            })

            if (payment?.id) {
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
        return res.render('generic/form-view', { form, title: req.__('payments_create_title') })
    } catch (error) {
        console.error(`Error creating payment: ${error.message}`)
        res.status(500).json({ message: error.message })
    }
}

export const print = async (req, res) => {
    try {
        const { id } = req.params
        const payment = await getById(id)

        if (!payment) {
            return res.status(404).send('Payment not found')
        }

        const contractor = await getContractorById(payment.contractorId)
        const stage = await getStageById(payment.stageId)
        const project = await getPaymentProject(id)

        if (!contractor || !stage || !project) {
            return res.status(404).send('Payment not found')
        }

        res.render('app/payments/invoice', {
            payment,
            contractor,
            project,
            stage: {
                ...stage,
                estimatedCostWords: numberToWords(payment.amount, req.getLocale()).toUpperCase()
            },
            utils: {
                formatToCurrency,
                paymentCurrencyOptions: {
                    currency: payment.displayCurrencyCode || stage.displayCurrencyCode,
                    symbol: payment.displayCurrencySymbol || stage.displayCurrencySymbol
                },
                stageCurrencyOptions: {
                    currency: stage.displayCurrencyCode,
                    symbol: stage.displayCurrencySymbol
                }
            }
        })
    } catch (error) {
        console.error(`Error fetching payment: ${error}`)
        return res
            .status(500)
            .send('An error occurred while fetching the payment. Please try again later.')
    }
}

/**
 * Soft deletes a payment and redirects back to the stage view.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deletePayment = async (req, res) => {
    try {
        const { id, stageId } = req.params
        const payment = await getById(id)

        if (!payment) {
            return res.status(404).send('Payment not found')
        }

        const projectId = await getPaymentProject(id)

        await deletePaymentById(id)

        res.redirect(`/projects/show/${projectId}/stages/show/${stageId}`)
    } catch (error) {
        console.error(`Error deleting payment: ${error}`)
        return res
            .status(500)
            .send('An error occurred while deleting the payment. Please try again later.')
    }
}
