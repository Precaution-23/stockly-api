const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLBoolean } = require('graphql')
const PermissionType = require('../types/permissionType')
const db = require('../../../database/models')
const { hasPermission } = require('../../helpers/requestAuth')

const updatePermissionInput = new GraphQLInputObjectType({
  name: 'UpdatePermissionInput',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    create: { type: new GraphQLNonNull(GraphQLBoolean) },
    read: { type: new GraphQLNonNull(GraphQLBoolean) },
    update: { type: new GraphQLNonNull(GraphQLBoolean) },
    delete: { type: new GraphQLNonNull(GraphQLBoolean) }
  })
})

module.exports = {
  type: PermissionType,
  args: { payload: { type: new GraphQLNonNull(updatePermissionInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      if (!hasPermission(user, 'Roles', 'update')) throw new Error('Not authorized')
      const permission = await db.Permission.findByPk(payload.id)
      if (!permission) throw new Error('Permission not found')
      return permission.update(
        { create: payload.create, read: payload.read, update: payload.update, delete: payload.delete },
        { user_id: user.id }
      )
    } catch (error) {
      return error
    }
  }
}
