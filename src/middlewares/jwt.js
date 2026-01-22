import * as jose from 'jose'
import { getUserById } from '@/services/users'

export const setUser = async (req, res, next) => {
    const token = req.cookies.token
    res.locals.user = null // Default

    if (!token) {
        return next()
    }

    try {
        const secret = new TextEncoder().encode(process.env.SECRET_KEY)
        const { payload } = await jose.jwtVerify(token, secret, {
            algorithms: ['HS256']
        })

        const user = await getUserById(payload.id)

        if (user) {
            req.user = user
            res.locals.user = user
        }
    } catch (err) {
        // Token invalid or expired, just ignore
    }
    next()
}

export const authenticateToken = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login')
    }
    next()
}

