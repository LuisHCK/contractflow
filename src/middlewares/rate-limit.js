import rateLimit from 'express-rate-limit'

const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000

const buildParkingHandler = windowMs => (req, res, _next, options) => {
    const retryAfterMinutes = Math.max(1, Math.ceil(windowMs / 60000))
    const limit = req.rateLimit?.limit ?? null
    const translate = key => (typeof res.__ === 'function' ? res.__(key) : key)

    res.status(options.statusCode).render('generic/rate-limit', {
        title: translate('rate_limit_meta_title'),
        retryAfterMinutes,
        rateLimitLimit: limit,
        rateLimitedPath: req.originalUrl
    })
}

const createLimiter = ({ limit, windowMs = FIFTEEN_MINUTES_IN_MS }) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        handler: buildParkingHandler(windowMs)
    })

export const globalLimiter = createLimiter({ limit: 100 })

export const authLimiter = createLimiter({ limit: 5 })
