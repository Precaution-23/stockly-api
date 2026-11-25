const { GraphQLObjectType, GraphQLNonNull, GraphQLString } = require('graphql')
const UserType = require('./userType')

const AuthType = new GraphQLObjectType({
  name: 'Auth',
  fields: () => ({
    token: { type: new GraphQLNonNull(GraphQLString) },
    user: { type: new GraphQLNonNull(UserType) }
  })
})

module.exports = AuthType
