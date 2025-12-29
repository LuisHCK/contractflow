import * as evidenceService from '@/services/evidences'
import { getPaymentProject, getPaymentStage } from '@/services/payments'
import { EVIDENCE_FORM } from '@/forms'

export const index = async (req, res) => {
    const { paymentId } = req.params
    try {
        const evidences = await evidenceService.getAll(paymentId)
        const pageData = formatTableViewData({
            data: evidences,
            form: EVIDENCE_FORM,
            baseRoute: 'evidences',
            title: req.__('evidences_list_title'),
            description: req.__('evidences_list_description'),
            showCreate: true,
            createPath: '/evidences/create'
        })

        return res.render('generic/table-view', pageData)
    } catch (error) {
        console.error(`Error fetching evidences: ${error.message}`)
        res.status(500).json({ error: 'Failed to fetch evidences' })
    }
}

export const show = async (req, res) => {
    const { id } = req.params
    try {
        const evidence = await evidenceService.getById(id)

        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found' })
        }
        res.render('app/evidences/show', { evidence })
    } catch (error) {
        console.error(`Error fetching evidence: ${error.message}`)
        res.status(500).json({ error: 'Failed to fetch evidence' })
    }
}

export const create = async (req, res) => {
    const { type, description } = req.body || {}
    const { paymentId } = req.params
    try {
        // Render the form for creating a new evidence
        if (req.method === 'GET') {
            return res.render('generic/form-view', {
                title: req.__('evidences_create_title'),
                form: EVIDENCE_FORM
            })
        }

        if (!req.file) {
            return res.render('generic/form-view', {
                title: req.__('evidences_create_title'),
                form: EVIDENCE_FORM,
                error: 'File is required'
            })
        }

        // Handle form submission for creating a new evidence
        const newEvidence = await evidenceService.create({
            paymentId,
            type,
            description,
            filePath: req.file.path,
            createdBy: 1 // Replace with actual user ID
        })

        const projectId = await getPaymentProject(paymentId)
        const stageId = await getPaymentStage(paymentId)

        console.log({ projectId, stageId })

        if (!projectId || !stageId) {
            // Rollback file upload if project or stage retrieval fails
            if (req.file) {
                Bun.file(req.file?.path).delete()
            }

            return res.render('generic/form-view', {
                title: req.__('evidences_create_title'),
                form: EVIDENCE_FORM,
                messages: [
                    { content: 'Failed to retrieve project or stage information', type: 'error' }
                ]
            })
        }

        if (!newEvidence?.id) {
            // Rollback file upload if creation fails
            if (req.file) {
                Bun.file(req.file?.path).delete()
            }

            return res.render('generic/form-view', {
                title: req.__('evidences_create_title'),
                form: EVIDENCE_FORM,
                error: 'Failed to create evidence'
            })
        }

        res.redirect(`/projects/show/${projectId}/stages/show/${stageId}`)
    } catch (error) {
        console.error(`Error creating evidence: ${error.message}`)
        res.status(500).json({ error: 'Failed to create evidence' })
    }
}
