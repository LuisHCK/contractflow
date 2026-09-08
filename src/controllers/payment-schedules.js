import { PAYMENT_SCHEDULE_FORM } from '@/forms'
import { populateForm } from '@/forms/utils'
import { getStageById } from '@/services/stages'
import { getProjectById } from '@/services/projects'
import { createSchedule, deleteScheduleByStage } from '@/services/payment-schedules'

export const create = async (req, res) => {
    try {
        const { id: projectId, stageId } = req.params
        const stage = await getStageById(stageId)
        if (!stage?.id) return res.status(404).send('Stage not found')
        const project = await getProjectById(projectId)

        const render = ({ error, data }) =>
            res.render('app/payment-schedules/create', {
                stage,
                project,
                form: populateForm({
                    form: PAYMENT_SCHEDULE_FORM,
                    data: { startDate: new Date().toISOString().split('T')[0], ...data }
                }),
                error
            })

        if (req.method === 'POST') {
            const schedule = await createSchedule({
                stageId,
                ...req.body,
                createdBy: req.user.id
            })

            if (schedule?.id) {
                return res.redirect(`/projects/show/${projectId}/stages/show/${stageId}`)
            }
            return render({ error: true, data: req.body })
        }

        render({ error: Boolean(req.query.error), data: req.body })
    } catch (error) {
        console.error(`Error creating payment schedule: ${error.message}`)
        res.status(500).send('An error occurred while creating the payment schedule. Please try again later.')
    }
}

export const destroy = async (req, res) => {
    try {
        const { id: projectId, stageId } = req.params
        await deleteScheduleByStage(stageId)
        res.redirect(`/projects/show/${projectId}/stages/show/${stageId}`)
    } catch (error) {
        console.error(`Error deleting payment schedule: ${error.message}`)
        res.status(500).send('An error occurred while deleting the payment schedule. Please try again later.')
    }
}
