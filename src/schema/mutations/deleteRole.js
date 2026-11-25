const { GraphQLNonNull, GraphQLID, GraphQLBoolean } = require('graphql')
const db = require('../../../database/models')
const { hasPermission } = require('../../helpers/requestAuth')

module.exports = {
  type: GraphQLBoolean,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      if (!hasPermission(user, 'Roles', 'delete')) throw new Error('Not authorized')

      const role = await db.Role.findByPk(id)
      if (!role) throw new Error('Role not found')

      const userCount = await db.User.count({ where: { role_id: id } })
      if (userCount > 0) throw new Error('Cannot delete this role while it is assigned to active users')

      await db.sequelize.transaction(async (transaction) => {
        // Permissions are not soft-deleted, so remove them with the role
        await db.Permission.destroy({ where: { role_id: id }, transaction })
        await role.destroy({ user_id: user.id, transaction })
      })
      return true
    } catch (error) {
      return error
    }
  }
}
