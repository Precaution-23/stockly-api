const { GraphQLNonNull, GraphQLInputObjectType, GraphQLString } = require('graphql')
const bcrypt = require('bcryptjs')
const MessageType = require('../types/messageType')
const rateLimit = require('../../helpers/rateLimit')
const { assertStrongPassword } = require('../../helpers/passwordPolicy')

const changePasswordInput = new GraphQLInputObjectType({
  name: 'ChangePasswordInput',
  fields: () => ({
    current_password: { type: new GraphQLNonNull(GraphQLString) },
    new_password: { type: new GraphQLNonNull(GraphQLString) }
  })
})

// Logged-in user changes their own password (requires the current one)
module.exports = {
  type: MessageType,
  args: { payload: { type: new GraphQLNonNull(changePasswordInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      const key = `change-password:${user.id}`
      rateLimit.check(key, 5, 15 * 60 * 1000)

      const valid = await bcrypt.compare(payload.current_password, user.password)
      if (!valid) {
        rateLimit.hit(key, 5, 15 * 60 * 1000)
        throw new Error('Current password is incorrect')
      }
      if (payload.current_password === payload.new_password) {
        throw new Error('New password must be different from the current one')
      }
      assertStrongPassword(payload.new_password, user.email)

      rateLimit.reset(key)
      const hash = await bcrypt.hash(payload.new_password, 10)
      await user.update({ password: hash }, { user_id: user.id })
      return { message: 'Password changed' }
    } catch (error) {
      return error
    }
  }
}
