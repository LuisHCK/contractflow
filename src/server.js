// Basic express typescript server
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import i18n from 'i18n'
import privateRouter from './routes/private'
import publicRouter from './routes/public'
import { init as dbInit } from './database'
import passport from 'passport'
import session from 'express-session'
import initializePassport from './auth/passport'
import { setLocals } from './middlewares/auth'
import { BunSQLiteStore } from './auth/bun-sqlite-store'
import { formatToCurrency } from './utils/money'
const app = express()
const localesDirectory = path.join(process.cwd(), 'locales')

const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
    fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
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
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
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

// Make formatToCurrency available in all EJS templates
app.locals.formatToCurrency = formatToCurrency

// Serve static files
app.use(express.static(path.join(__dirname, '/public')))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Initialize passport
initializePassport(passport)

app.use(
    session({
        store: new BunSQLiteStore(), // Store session in SQLite database
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        }
    })
)
app.use(passport.initialize())
app.use(passport.session())
app.use(setLocals)

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
    res.render('generic/404', { title: '404 - Not Found' })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Open http://localhost:${port} in your browser 🚀`)
    console.log(`Server listening on port ${port}`)
})
