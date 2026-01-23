import express from 'express'
import { index as homePage } from '@/controllers/home'
import { login } from '@/controllers/auth'
import { authLimiter } from '@/middlewares/rate-limit'

const router = express.Router()

router.get('/', homePage)
router.get('/login', login)
router.post('/login', authLimiter, login)

export default router
