const { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLBoolean } = require('graphql')

const PermissionType = new GraphQLObjectType({
  name: 'Permission',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    role_id: { type: GraphQLID },
    resource: { type: new GraphQLNonNull(GraphQLString) },
    create: { type: GraphQLBoolean, resolve: p => p.get('create') },
    read: { type: GraphQLBoolean, resolve: p => p.get('read') },
    update: { type: GraphQLBoolean, resolve: p => p.get('update') },
    delete: { type: GraphQLBoolean, resolve: p => p.get('delete') }
  })
})

module.exports = PermissionType
