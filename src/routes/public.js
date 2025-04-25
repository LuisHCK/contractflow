import express from 'express'
import { index as homePage } from '@/controllers/home'
import { login } from '@/controllers/auth'

const router = express.Router()

router.get('/', homePage)
router.get('/login', login)
router.post('/login', login)

export default router
