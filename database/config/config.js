require('dotenv').config()

module.exports = {
  development: {
    url: process.env.DEV_DATABASE_URL,
    use_env_variable: 'DEV_DATABASE_URL',
    dialect: 'postgres'
  },
  staging: {
    url: process.env.DEV_DATABASE_URL,
    use_env_variable: 'DEV_DATABASE_URL',
    dialect: 'postgres'
  },
  production: {
    url: process.env.DATABASE_URL,
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    // Hosted Postgres (Neon) requires SSL
    dialectOptions: { ssl: { require: true } },
    logging: false
  }
}
