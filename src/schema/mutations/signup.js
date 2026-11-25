const { GraphQLNonNull, GraphQLInputObjectType, GraphQLString, GraphQLID } = require('graphql')
const bcrypt = require('bcryptjs')
const AuthType = require('../types/authType')
const Jwt = require('../../helpers/jwt')
const db = require('../../../database/models')

const signupInput = new GraphQLInputObjectType({
  name: 'SignupInput',
  fields: () => ({
    first_name: { type: new GraphQLNonNull(GraphQLString) },
    last_name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    group_name: { type: GraphQLString },
    role_id: { type: GraphQLID }
  })
})

module.exports = {
  type: AuthType,
  args: {
    payload: { type: new GraphQLNonNull(signupInput) }
  },
  async resolve(_, { payload }) {
    try {
      const existing = await db.User.findOne({ where: { email: payload.email } })
      if (existing) throw new Error('Email already in use')

      const hashedPassword = await bcrypt.hash(payload.password, 10)
      const user = await db.User.create({
        ...payload,
        password: hashedPassword,
        group_name: payload.group_name || 'requester'
      })

      const userWithRole = await db.User.findByPk(user.id, {
        include: [{ model: db.Role, include: [{ model: db.Permission }] }]
      })

      const token = Jwt.generateToken(userWithRole)
      return { token, user: userWithRole }
    } catch (error) {
      return error
    }
  }
}
