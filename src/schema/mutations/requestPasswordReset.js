const { GraphQLNonNull, GraphQLInputObjectType, GraphQLString } = require('graphql')
const Jwt = require('../../helpers/jwt')
const { sendPasswordResetEmail } = require('../../helpers/mailer')
const MessageType = require('../types/messageType')
const db = require('../../../database/models')

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
  async resolve(_, { payload }) {
    try {
      const user = await db.User.findOne({ where: { email: payload.email } })
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
