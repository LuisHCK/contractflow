// Basic express typescript server
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import routes from './routes'
import { init as dbInit } from './database'

const app = express()

// Initialize database
dbInit()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'));
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Serve static files
app.use(express.static( path.join(__dirname, '/public')))

// Routes
app.use(routes)

app.post('/api/payments', (req, res) => {
    console.log(req.body)
    res.send('ok')
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Open http://localhost:${port} in your browser 🚀`)
    console.log(`Server listening on port ${port}`)
})
