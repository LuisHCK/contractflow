// Express simple router
import express from 'express'
import * as projectController from '@/controllers/projects'
import * as stageController from '@/controllers/stages'
import * as contractorsController from '@/controllers/contractors'
import * as paymentsController from '@/controllers/payments'
import * as paymentCategoriesController from '@/controllers/payment-categories'
import * as evidencesController from '@/controllers/evidences'
import { uploadFileMiddleware as uploadFileMiddleware } from '@/middlewares/upload'
import { ensureAuthenticated } from '@/middlewares/auth'

const router = express.Router()

router.use(ensureAuthenticated)

/**
 * PROJECTS
 */
router.get('/projects', projectController.index)
router.get('/projects/show/:id', projectController.show)
router.get('/projects/create', projectController.create)
router.post('/projects/create', projectController.create)
router.get('/projects/edit/:id', projectController.edit)
router.post('/projects/edit/:id', projectController.edit)

/**
 * STAGES
 */
router.get('/projects/show/:id/stages/show', stageController.index)
router.get('/projects/show/:id/stages/show/:stageId', stageController.show)
router.get('/projects/show/:id/stages/create', stageController.create)
router.post('/projects/show/:id/stages/create', stageController.create)
router.get('/projects/show/:id/stages/edit/:stageId', stageController.edit)
router.post('/projects/show/:id/stages/edit/:stageId', stageController.edit)

/**
 * PAYMENTS
 */
router.get('/projects/show/:id/stages/show/:stageId/payments/', paymentsController.index)
router.get(
    '/projects/show/:id/stages/show/:stageId/payments/create',
    paymentsController.createStagePayment
)
router.post(
    '/projects/show/:id/stages/show/:stageId/payments/create',
    paymentsController.createStagePayment
)

/**
 * CONTRACTORS
 */
router.get('/contractors', contractorsController.index)
router.get('/contractors/show/:id', contractorsController.show)
router.get('/contractors/create', contractorsController.create)
router.post('/contractors/create', contractorsController.create)
router.get('/contractors/edit/:id', contractorsController.update)
router.delete('/contractors/remove/:id', contractorsController.remove)

/**
 * PAYMENT CATEGORIES
 */
router.get('/payment-categories', paymentCategoriesController.index)
router.get('/payment-categories/show/:id', paymentCategoriesController.show)
router.get('/payment-categories/create', paymentCategoriesController.create)
router.post('/payment-categories/create', paymentCategoriesController.create)
router.get('/payment-categories/edit/:id', paymentCategoriesController.edit)
router.post('/payment-categories/edit/:id', paymentCategoriesController.edit)

/**
 * EVIDENCES
 */
router.get('/payments/show/:paymentId/evidences', evidencesController.index)
router.get('/payments/show/:paymentId/evidences/show/:id', evidencesController.show)
router.get('/payments/show/:paymentId/evidences/create', evidencesController.create)
router.post(
    '/payments/show/:paymentId/evidences/create',
    uploadFileMiddleware.single('attachment'),
    evidencesController.create
)

export default router
