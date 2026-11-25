const { GraphQLNonNull, GraphQLInputObjectType, GraphQLString } = require('graphql')
const bcrypt = require('bcryptjs')
const Jwt = require('../../helpers/jwt')
const MessageType = require('../types/messageType')

const resetPasswordInput = new GraphQLInputObjectType({
  name: 'ResetPasswordInput',
  fields: () => ({
    token: { type: new GraphQLNonNull(GraphQLString) },
    new_password: { type: new GraphQLNonNull(GraphQLString) }
  })
})

module.exports = {
  type: MessageType,
  args: {
    payload: { type: new GraphQLNonNull(resetPasswordInput) }
  },
  async resolve(_, { payload }) {
    try {
      const user = await Jwt.verifyResetToken(payload.token)
      if (!payload.new_password || payload.new_password.length < 8) throw new Error('Password must be at least 8 characters')
      const hashedPassword = await bcrypt.hash(payload.new_password, 10)
      await user.update({ password: hashedPassword })
      return { message: 'Password updated successfully.' }
    } catch (error) {
      return error
    }
  }
}
