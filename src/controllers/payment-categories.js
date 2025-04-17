import { PAYMENT_CATEGORY_FORM } from '@/forms'
import * as service from '@/services/payment-categories'
import { formatDetailViewData, formatTableViewData } from '@/utils/generic-views'

export const index = async (_req, res) => {
    try {
        const categories = await service.getAll()
        const pageData = formatTableViewData({
            data: categories,
            form: PAYMENT_CATEGORY_FORM,
            baseRoute: 'payment-categories',
            title: 'Payment Categories',
            description: 'List of payment categories',
            showCreate: true
        })
        res.render('generic/table-view', pageData)
    } catch (error) {
        console.error(`Error fetching payment categories: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching payment categories. Please try again later.')
    }
}

export const show = async (req, res) => {
    try {
        const { params } = req
        const category = await service.getById(params.id)

        if (!category?.id) {
            return res.status(404).send('Payment category not found')
        }

        const pageData = formatDetailViewData({
            data: category,
            form: PAYMENT_CATEGORY_FORM,
            baseRoute: 'payment-categories',
            title: `Payment Category: ${category.name}`,
            description: 'Payment category details'
        })

        res.render('generic/detail-view', pageData)
    } catch (error) {
        console.error(`Error fetching payment category: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching the payment category. Please try again later.')
    }
}

export const edit = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            const updatedCategory = await service.update(params.id, { ...body })

            if (updatedCategory?.id) {
                return res.redirect(`/payment-categories/show/${params.id}`)
            }

            res.redirect(`/payment-categories/edit/${params.id}?error=true`)
        }

        // Get instance
        const category = await service.getById(req.params.id)

        if (!category?.id) {
            return res.status(404).json({ message: 'Payment category not found' })
        }

        // Render form edit view
        res.render('generic/form-view', {
            form: {
                ...PAYMENT_CATEGORY_FORM,
                method: 'POST',
                action: req.params.id,
                fields: PAYMENT_CATEGORY_FORM.fields.map((field) => {
                    const value = category[field.name]
                    return { ...field, value }
                })
            },
            title: `Edit Payment Category: ${category.name}`
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const create = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body } = req
            const category = await service.create({ ...body })

            if (category?.id) {
                res.redirect('/payment-categories')
            } else {
                res.redirect('/payment-categories/create?error=true')
            }
        }

        // Render form view
        res.render('generic/form-view', {
            form: PAYMENT_CATEGORY_FORM,
            title: 'Create Payment Category'
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
