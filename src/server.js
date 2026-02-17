// Basic express typescript server
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import i18n from 'i18n'
import csrf from '@dr.pogodin/csurf'
import privateRouter from './routes/private'
import publicRouter from './routes/public'
import { init as dbInit } from './database'
import { formatToCurrency } from './utils/money'
import { setUser } from './middlewares/jwt'
import { flash } from './middlewares/flash'
import { globalLimiter } from './middlewares/rate-limit'
import { formatDate } from './utils/date'

const app = express()
const localesDirectory = path.join(process.cwd(), 'locales')

const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://fonts.googleapis.com'
    ],
    imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
    fontSrc: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://fonts.gstatic.com'
    ],
    connectSrc: ["'self'"],
    frameSrc: ["'self'"],
    frameAncestors: ["'self'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"]
}

// Initialize database
dbInit()

// Basic security hardening
app.disable('x-powered-by')
// Trust proxy (required for rate limiting behind proxies)
app.set('trust proxy', 1)

// Initialize EJS template engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: cspDirectives
        },
        crossOriginEmbedderPolicy: false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    })
)
app.use(cookieParser())

i18n.configure({
    locales: ['en', 'es'],
    directory: localesDirectory,
    defaultLocale: 'en',
    queryParameter: 'lang',
    cookie: 'lang',
    autoReload: true,
    updateFiles: false
})
app.use(i18n.init)
app.use((req, res, next) => {
    res.locals.__ = res.__
    res.locals.locale = req.getLocale()
    next()
})

app.use(setUser)
app.use(globalLimiter)
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
        optionsSuccessStatus: 200
    })
)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(csrf({ cookie: true }))
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken()
    next()
})

// Make formatToCurrency available in all EJS templates
app.locals.formatToCurrency = formatToCurrency
app.locals.formatDate = formatDate

// Serve static files
app.use(express.static(path.join(__dirname, '/public')))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use(flash)

app.get('/lang/:locale', (req, res) => {
    const { locale } = req.params
    if (['en', 'es'].includes(locale)) {
        res.cookie('lang', locale, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true })
    }
    const redirectTo = req.query.redirect || req.get('referer') || '/'
    res.redirect(redirectTo)
})

// Public routes
app.use(publicRouter)

// Private Routes
app.use(privateRouter)

// Handle 404 errors
app.use((_req, res, _next) => {
    res.status(404).render('generic/404', { title: '404 - Not Found' })
})

// Global Error Handler
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).send('Invalid CSRF Token')
    }

    console.error(err)
    res.status(500).send('Internal Server Error')
})

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.clear()
    console.log(`
  ____            _                  _   _____ _               
 / ___|___  _ __ | |_ _ __ __ _  ___| |_|  ___| | _____      __
| |   / _ \\| '_ \\| __| '__/ _\` |/ __| __| |_  | |/ _ \\ \\ /\\ / /
| |__| (_) | | | | |_| | | (_| | (__| |_|  _| | | (_) \\ V  V / 
 \\____\\___/|_| |_|\\__|_|  \\__,_|\\___|\\__|_|   |_|\\___/ \\_/\\_/                                                                                                                                                                       
    `)
    console.log(`Open http://localhost:${port} in your browser 🚀`)
    console.log(`Server listening on port ${port}`)
})
