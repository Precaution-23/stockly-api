const { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const DateType = require('./dateType')

const VendorType = new GraphQLObjectType({
  name: 'Vendor',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = VendorType
