require('dotenv').config()
const app = require('./server')
const { startReminderJob } = require('./jobs/reminders')

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`🚀 Stockly API running at http://localhost:${PORT}`)
  console.log(`📊 GraphQL playground: http://localhost:${PORT}/graphql`)
  if (process.env.NODE_ENV !== 'test') startReminderJob()
})
