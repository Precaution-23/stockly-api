const {
  GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString,
  GraphQLBoolean, GraphQLList
} = require('graphql')
const DateType = require('./dateType')

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    first_name: { type: new GraphQLNonNull(GraphQLString) },
    last_name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    group_name: { type: GraphQLString },
    is_active: { type: GraphQLBoolean },
    role: {
      type: require('./roleType'),
      async resolve(parent) {
        return parent.getRole ? parent.getRole() : null
      }
    },
    permissions: {
      type: new GraphQLList(require('./permissionType')),
      async resolve(parent) {
        const role = await (parent.getRole ? parent.getRole() : null)
        if (!role) return []
        return role.getPermissions ? role.getPermissions() : []
      }
    },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = UserType
