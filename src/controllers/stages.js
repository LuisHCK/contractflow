import { STAGE_FORM } from '@/forms'
import { formatOptions, populateForm } from '@/forms/utils'
import { getAllPayments } from '@/services/payments'
import { getProjectById } from '@/services/projects'
import { getAll as getAllContractors } from '@/services/contractors'
import { createStage, getStageById, updateStage } from '@/services/stages'

export const index = async (_req, res) => {
    try {
        const stages = await getAllStages()
        res.render('stages/index', { stages })
    } catch (error) {
        console.error(`Error fetching stages: ${error}`)
        return res
            .status(500)
            .send('An error occurred while fetching stages. Please try again later.')
    }
}

export const show = async (req, res) => {
    try {
        const { params } = req
        const stage = await getStageById(params.stageId)
        const project = await getProjectById(params.id)
        const payments = await getAllPayments(stage.id, { includeRelated: true })

        if (!stage?.id) {
            return res.status(404).send('Stage not found')
        }

        res.render('app/stages/show', { stage, project, payments })
    } catch (error) {
        console.error(`[StagesController.show] Error fetching stage: ${error}`)
        return res
            .status(500)
            .send('An error occurred while fetching stage. Please try again later.')
    }
}

export const edit = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params, query } = req
            const updatedStage = await updateStage(params.stageId, { ...body })

            if (updatedStage?.id) {
                console.log(query)
                if (query.backto === 'details') {
                    return res.redirect(`/projects/show/${params.id}/stages/show/${params.stageId}`)
                }

                return res.redirect(`/projects/show/${params.id}`)
            }

            res.redirect(`/projects/show/${params.id}/stages/edit/${params.stageId}?error=true`)
        }

        // Get instance
        const stage = await getStageById(req.params.stageId)

        if (!stage?.id) {
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

export const create = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            const stage = await createStage({ ...body, projectId: params.id, createdBy: 1 })

            if (stage?.id) {
                res.redirect(`/projects/show/${params.id}`)
            } else {
                res.redirect(`/projects/show/${params.id}/stages/create?error=true`)
            }
            return
        }

        const contractorsOptions = formatOptions({
            items: await getAllContractors()
        })

        const form = populateForm({
            form: STAGE_FORM,
            data: {
                ...req.body,
                contractorId: contractorsOptions
            }
        })

        // Render form view
        res.render('generic/form-view', { form, title: 'Create project stage' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
}
