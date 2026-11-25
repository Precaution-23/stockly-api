const { GraphQLNonNull, GraphQLInputObjectType, GraphQLString } = require('graphql')
const bcrypt = require('bcryptjs')
const AuthType = require('../types/authType')
const Jwt = require('../../helpers/jwt')
const db = require('../../../database/models')

const loginInput = new GraphQLInputObjectType({
  name: 'LoginInput',
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
  async resolve(_, { payload }) {
    try {
      const user = await db.User.findOne({
        where: { email: payload.email },
        include: [{ model: db.Role, include: [{ model: db.Permission }] }]
      })
      if (!user) throw new Error('Invalid credentials')
      if (!user.is_active) throw new Error('Account is deactivated')

      const valid = await bcrypt.compare(payload.password, user.password)
      if (!valid) throw new Error('Invalid credentials')

      const token = Jwt.generateToken(user)
      return { token, user }
    } catch (error) {
      return error
    }
  }
}
