const { GraphQLObjectType, GraphQLString } = require('graphql')

module.exports = new GraphQLObjectType({
  name: 'MessageType',
  fields: () => ({
    message: { type: GraphQLString }
  })
})
