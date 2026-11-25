const { GraphQLNonNull, GraphQLInputObjectType, GraphQLString } = require('graphql')
const bcrypt = require('bcryptjs')
const AuthType = require('../types/authType')
const Jwt = require('../../helpers/jwt')
const db = require('../../../database/models')
const rateLimit = require('../../helpers/rateLimit')

const WINDOW = 15 * 60 * 1000

const loginInput = new GraphQLInputObjectType({
  name: 'LoginMutationInput',
  fields: () => ({
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) }
  })
})

module.exports = {
  type: AuthType,
  args: {
    payload: { type: new GraphQLNonNull(loginInput) }
  },
  async resolve(_, { payload }, context) {
    try {
      const email = String(payload.email || '').trim().toLowerCase()
      const emailKey = `login:email:${email}`
      const ipKey = `login:ip:${context.ip}`
      rateLimit.check(emailKey, 5, WINDOW)
      rateLimit.check(ipKey, 20, WINDOW)

      const user = await db.User.findOne({
        where: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), email),
        include: [{ model: db.Role, include: [{ model: db.Permission }] }]
      })
      const valid = user ? await bcrypt.compare(payload.password, user.password) : false

      // Same message for unknown, wrong-password and deactivated accounts, so emails can't be probed
      if (!valid || !user.is_active) {
        rateLimit.hit(emailKey, 5, WINDOW)
        rateLimit.hit(ipKey, 20, WINDOW)
        throw new Error('Invalid credentials')
      }

      rateLimit.reset(emailKey)
      const token = Jwt.generateToken(user)
      return { token, user }
    } catch (error) {
      return error
    }
  }
}
