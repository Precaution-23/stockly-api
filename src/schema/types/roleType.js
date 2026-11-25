const { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLList, GraphQLInt } = require('graphql')
const DateType = require('./dateType')
const db = require('../../../database/models')

const RoleType = new GraphQLObjectType({
  name: 'Role',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    permissions: {
      type: new GraphQLList(require('./permissionType')),
      async resolve(parent) {
        return parent.getPermissions ? parent.getPermissions() : []
      }
    },
    user_count: {
      type: GraphQLInt,
      resolve(parent) {
        return db.User.count({ where: { role_id: parent.id } })
      }
    },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = RoleType
