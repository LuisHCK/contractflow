import { PAYMENT_FORM, PROJECT_FORM } from '@/forms'
import { createPayment, getAllPayments } from '@/services/payments'
import { createProject, getAllProjects, getProjectById, updateProject } from '@/services/projects'
import { getStageById, getStagesByProject } from '@/services/stages'
import { Project } from '@/database/models'
import { format } from 'date-fns'
import { DATE_FORMAT } from '@/config/constants'

export const index = async (_req, res) => {
    try {
        const projects = await getAllProjects()
        res.render('app/projects/index', { projects })
    } catch (error) {
        console.error(`Error fetching projects: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching projects. Please try again later.')
    }
}

export const create = async (req, res) => {
    if (req.method === 'POST') {
        const { body } = req

        const project = await createProject({ ...body, createdBy: 1 })

        if (!project?.id) {
            res.redirect('/projects/create?error=true')
        } else {
            res.redirect(`/projects/show/${project.id}?created=true`)
        }
    }
    res.render('generic/form-view', { form: PROJECT_FORM, title: 'Create project' })
}

export const show = async (req, res) => {
    try {
        const project = await getProjectById(req.params.id)
        const stages = await getStagesByProject(req.params.id)

        if (!project) {
            return res.status(404).send('Project not found')
        }

        res.render('app/projects/show', { project, stages })
    } catch (error) {
        console.error(`Error fetching project: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching project. Please try again later.')
    }
}

/**
 * Handles the editing of a project.
 *
 * - If the request method is 'POST', attempts to update the project with the provided data.
 *   - On success, redirects to the project's detail page.
 *   - On failure, redirects back to the edit page with an error query.
 * - If the request method is not 'POST', retrieves the project by ID and renders the edit form.
 *   - If the project is not found, responds with a 404 error.
 *   - Otherwise, renders the edit form with the project's current data.
 *
 * @async
 * @function edit
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const edit = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            const updatedProject = await updateProject(params.id, body)

            if (updatedProject?.id) {
                return res.redirect(`/projects/show/${params.id}`)
            }

            return res.redirect(`/projects/edit/${params.id}?error=true`)
        }

        // Get instance
        const project = await getProjectById(req.params.id)

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        // Render form edit view
        res.render('generic/form-view', {
            form: {
                ...PROJECT_FORM,
                method: 'POST',
                action: req.params.id,
                fields: PROJECT_FORM.fields.map((field) => {
                    const value = project[field.name]
                    return { ...field, value }
                })
            },
            title: `Edit project ${project.name}`
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getStages = async (req, res) => {
    try {
        const stages = await getStagesByProject(req.params.id)
        res.status(200).json(stages)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const listProjectStages = async (req, res) => {
    try {
        const stages = await getStagesByProject(req.params.id)
        res.render('app/projects/stages', { stages })
    } catch (error) {
        console.error(`Error fetching stages: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching stages. Please try again later.')
    }
}

export const showStagePayments = async (req, res) => {
    try {
        const stage = await getStageById(req.params.stageId)
        const payments = await getAllPayments(req.params.stageId)

        // Customize table view
        const data = payments.map((payment) => ({
            ...payment,
            date: format(payment.date, DATE_FORMAT),
            amount: () => `<span class="tag is-primary">$${payment.amount.toFixed(2)}</span>`,
            actions: () =>
                `<a href="/projects/show/${req.params.id}/stages/${req.params.stageId}/payments/show/${payment.id}" class="button is-small">View</a>`
        }))

        const fields = PAYMENT_FORM.fields.map((field) => field.name)
        fields.push('actions')

        res.render('generic/table-view', {
            data,
            fields,
            title: `Payments for stage: ${stage.name}`
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
