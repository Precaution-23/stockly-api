const { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const DateType = require('./dateType')

const DepartmentType = new GraphQLObjectType({
  name: 'Department',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    tag: { type: GraphQLString },
    inventory_prefix: { type: GraphQLString },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = DepartmentType
