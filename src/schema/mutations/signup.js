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
  // Public sign-up is disabled: only administrators create accounts (createUser)
  async resolve() {
    return new Error('Sign-up is disabled. Ask an administrator to create your account.')
  }
}
