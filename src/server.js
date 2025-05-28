// Basic express typescript server
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import privateRouter from './routes/private'
import publicRouter from './routes/public'
import { init as dbInit } from './database'
import passport from 'passport'
import session from 'express-session'
import initializePassport from './auth/passport'
import { setLocals } from './middlewares/auth'
import { BunSQLiteStore } from './auth/bun-sqlite-store'
const app = express()

// Initialize database
dbInit()

// Initialize EJS template engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

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
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        }
    })
)
app.use(passport.initialize())
app.use(passport.session())
app.use(setLocals)

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
