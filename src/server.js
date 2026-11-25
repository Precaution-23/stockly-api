require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { graphqlHTTP } = require('express-graphql')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

const schema = require('./schema')
const Jwt = require('./helpers/jwt')
const uploadsRouter = require('./routes/uploads')
const { UPLOADS_DIR } = require('./helpers/uploads')

const app = express()
const server = createServer(app)

// In production only the configured website origin(s) may call the API (CORS_ORIGIN, comma-separated)
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean)
if (process.env.NODE_ENV === 'production' && !allowedOrigins.length) {
  console.warn('⚠️  CORS_ORIGIN is not set — browsers will be blocked from calling the API')
}
app.use(cors(process.env.NODE_ENV === 'production' ? { origin: allowedOrigins } : undefined))
app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('combined'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

// Upload invoices/quotations (POST) and serve uploaded files (GET)
app.use('/uploads', uploadsRouter)
app.use('/uploads', express.static(UPLOADS_DIR))

// Build GraphQL context from JWT
const buildContext = async (req) => {
  return async () => {
    const { authorization } = req.headers
    if (!authorization) throw new Error('Authorization header missing')
    const token = authorization.split(' ')[1]
    const user = await Jwt.verifyToken(token)
    return { user, token }
  }
}

app.use(
  '/graphql',
  graphqlHTTP(async (req) => ({
    schema,
    context: await buildContext(req),
    graphiql: process.env.NODE_ENV !== 'production'
  }))
)

app.get('/', (_, res) => {
  const env = process.env.NODE_ENV || 'development'
  res.status(200).json({ message: `🚀 Stockly API (${env}) is running` })
})

module.exports = server
