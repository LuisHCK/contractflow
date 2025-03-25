// Express simple router
import express from 'express'
import * as homeController from '@/controllers/home'
import * as projectController from '@/controllers/projects'

const router = express.Router()

/**
 * HOMEPAGE
 */
router.get('/', homeController.index)

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
router.get('/projects/show/:id/stages/create', projectController.createProjectStage)
router.post('/projects/show/:id/stages/create', projectController.createProjectStage)
router.get('/projects/show/:id/stages/edit/:stageId', projectController.editProjectStage)
router.post('/projects/show/:id/stages/edit/:stageId', projectController.editProjectStage)

/**
 * PAYMENTS
 */
router.get('/projects/show/:id/stages/show/:stageId/payments/', projectController.showStagePayments)
router.get('/projects/show/:id/stages/show/:stageId/payments/create', projectController.createStagePayment)
router.post('/projects/show/:id/stages/show/:stageId/payments/create', projectController.createStagePayment)

export default router
