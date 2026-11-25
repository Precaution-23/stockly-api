require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { graphqlHTTP } = require('express-graphql')
const { NoSchemaIntrospectionCustomRule } = require('graphql')
const depthLimit = require('./helpers/depthLimit')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

const schema = require('./schema')
const Jwt = require('./helpers/jwt')
const uploadsRouter = require('./routes/uploads')

const app = express()
// Render terminates TLS in front of us; trust its X-Forwarded-For so req.ip is the real client (rate limits)
app.set('trust proxy', 1)
const server = createServer(app)

// In production only the configured website origin(s) may call the API (CORS_ORIGIN, comma-separated)
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean)
if (process.env.NODE_ENV === 'production' && !allowedOrigins.length) {
  console.warn('⚠️  CORS_ORIGIN is not set — browsers will be blocked from calling the API')
}
app.use(cors(process.env.NODE_ENV === 'production' ? { origin: allowedOrigins } : undefined))
app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('combined'))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Upload invoices/quotations (POST) and download them (GET); both require a logged-in user
app.use('/uploads', uploadsRouter)

// Build GraphQL context from JWT
// Resolvers call context() to authenticate; context.ip is available without logging in (rate limits)
const buildContext = async (req) => {
  const context = async () => {
    const { authorization } = req.headers
    if (!authorization) throw new Error('Authorization header missing')
    const token = authorization.split(' ')[1]
    const user = await Jwt.verifyToken(token)
    return { user, token }
  }
  context.ip = req.ip
  return context
}

const isProduction = process.env.NODE_ENV === 'production'
// Production: hide the schema from introspection and refuse absurdly nested queries
const validationRules = [depthLimit(10), ...(isProduction ? [NoSchemaIntrospectionCustomRule] : [])]

app.use(
  '/graphql',
  graphqlHTTP(async (req) => ({
    schema,
    context: await buildContext(req),
    graphiql: !isProduction,
    validationRules
  }))
)

app.get('/', (_, res) => {
  const env = process.env.NODE_ENV || 'development'
  res.status(200).json({ message: `🚀 Stockly API (${env}) is running` })
})

module.exports = server
