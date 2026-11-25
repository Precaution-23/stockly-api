const { GraphQLObjectType, GraphQLString } = require('graphql')
const Jwt = require('../../helpers/jwt')

module.exports = {
  type: new GraphQLObjectType({
    name: 'LogoutResponse',
    fields: { message: { type: GraphQLString } }
  }),
  async resolve(_, __, context) {
    const { token } = await context()
    await Jwt.blacklistToken(token)
    return { message: 'Logged out successfully' }
  }
}
