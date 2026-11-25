const { GraphQLNonNull, GraphQLInputObjectType, GraphQLString } = require('graphql')
const Jwt = require('../../helpers/jwt')
const { sendPasswordResetEmail } = require('../../helpers/mailer')
const MessageType = require('../types/messageType')
const db = require('../../../database/models')
const rateLimit = require('../../helpers/rateLimit')

const HOUR = 60 * 60 * 1000

const requestPasswordResetInput = new GraphQLInputObjectType({
  name: 'RequestPasswordResetInput',
  fields: () => ({
    email: { type: new GraphQLNonNull(GraphQLString) }
  })
})

module.exports = {
  type: MessageType,
  args: {
    payload: { type: new GraphQLNonNull(requestPasswordResetInput) }
  },
  async resolve(_, { payload }, context) {
    try {
      const email = String(payload.email || '').trim().toLowerCase()
      rateLimit.hit(`reset:ip:${context.ip}`, 10, HOUR)
      rateLimit.hit(`reset:email:${email}`, 3, HOUR)
      const user = await db.User.findOne({
        where: db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), email)
      })
      if (user && user.is_active) {
        const token = Jwt.generateResetToken(user)
        await sendPasswordResetEmail(user.email, token)
      }
      return { message: 'If that email exists, a reset link has been sent.' }
    } catch (error) {
      return error
    }
  }
}
