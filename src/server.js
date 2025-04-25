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

// Initialize passport
initializePassport(passport)

app.use(
    session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false
    })
)
app.use(passport.initialize())
app.use(passport.session())

// Public routes
app.post('/api/payments', (req, res) => {
    console.log(req.body)
    res.send('ok')
})

app.get('/api/hash', async (req, res) => {
    return res.status(200).send(
        await Bun.password.hash('password', {
            algorithm: 'argon2i',
            memoryCost: 2 ** 16,
            timeCost: 12
        })
    )
})

// Public routes
app.use(publicRouter)

// Private Routes
app.use(privateRouter)

// Handle 404 errors
app.use((_req, res, _next) => {
    res.status(404).send('404 Not Found')
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Open http://localhost:${port} in your browser 🚀`)
    console.log(`Server listening on port ${port}`)
})
