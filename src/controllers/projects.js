import { PAYMENT_FORM, PROJECT_FORM, STAGE_FORM } from '@/forms'
import { createPayment, getAllPayments } from '@/services/payments'
import { createProject, getAllProjects, getProjectById, updateProject } from '@/services/projects'
import { createStage, getStageById, getStagesByProject, updateStage } from '@/services/stages'

export const index = async (_req, res) => {
    try {
        const projects = await getAllProjects()
        res.render('projects/index', { projects })
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

        const project = await createProject(body)

        if (!project?.id) {
            res.redirect('/projects/create?error=true')
        } else {
            res.redirect(`/projects?created=${!!project?.id}`)
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

        res.render('projects/show', { project, stages })
    } catch (error) {
        console.error(`Error fetching project: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching project. Please try again later.')
    }
}

export const edit = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            console.log(body)
            const updatedProject = await updateProject(params.id, body)

            if (updatedProject?.id) {
                return res.redirect(`/projects/show/${params.id}`)
            }

            res.redirect(`/projects/edit/${params.id}?error=true`)
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
        res.render('projects/stages', { stages })
    } catch (error) {
        console.error(`Error fetching stages: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching stages. Please try again later.')
    }
}

export const createProjectStage = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            const stage = await createStage({ ...body, projectId: params.id, createdBy: 1 })

            if (stage?.id) {
                res.redirect(`/projects/show/${params.id}`)
            } else {
                res.redirect(`/projects/show/${params.id}/stages/create?error=true`)
            }
        }

        // Render form view
        res.render('projects/stages/create', { form: STAGE_FORM })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const editProjectStage = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            const updatedStage = await updateStage(params.stageId, { ...body })

            if (updatedStage?.id) {
                return res.redirect(`/projects/show/${params.id}`)
            }

            res.redirect(`/projects/show/${params.id}/stages/edit/${params.stageId}?error=true`)
        }

        // Get instance
        const stage = await getStageById(req.params.stageId)

        if (!stage) {
            // TODO: print a nice 404 error
            return res.status(404).json({ message: 'Stage not found' })
        }

        // Render form edit view
        res.render('generic/form-view', {
            form: {
                ...STAGE_FORM,
                method: 'POST',
                action: req.params.stageId,
                fields: STAGE_FORM.fields.map((field) => {
                    const value = stage[field.name]
                    return { ...field, value }
                })
            },
            title: `Edit stage ${stage.name}`
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const createStagePayment = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            const stage = await createPayment({ ...body, stageId: params.stageId })

            if (stage?.id) {
                res.redirect(`/projects/show/${params.id}`)
            } else {
                res.redirect(`/projects/show/${params.id}/stages/${params.stageId}/payments/create`)
            }
        }

        // Render form view
        res.render('generic/form-view', { form: PAYMENT_FORM, title: 'Register new payment' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const showStagePayments = async (req, res) => {
    try {
        const stage = await getStageById(req.params.stageId)
        const payments = await getAllPayments(req.params.stageId)
        res.render('generic/table-view', {
            data: payments,
            fields: PAYMENT_FORM.fields.map((field) => field.name),
            title: `Payments for stage: ${stage.name}`
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
