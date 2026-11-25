const { GraphQLNonNull, GraphQLID, GraphQLBoolean } = require('graphql')
const db = require('../../../database/models')
const { assertPermission } = require('../../helpers/requestAuth')

module.exports = {
  type: GraphQLBoolean,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      assertPermission(user, 'Users', 'delete')
      if (String(id) === String(user.id)) throw new Error('You cannot delete your own account')
      const target = await db.User.findByPk(id)
      if (!target) throw new Error('User not found')

      const [createdRequests, reviewedRequests, approvedRequests, purchasedRequests, inventoryCount] = await Promise.all([
        db.Request.count({ where: { created_by: id } }),
        db.Request.count({ where: { reviewed_by: id } }),
        db.Request.count({ where: { approved_by: id } }),
        db.Request.count({ where: { purchased_by: id } }),
        db.Inventory.count({ where: { created_by: id } })
      ])
      if (createdRequests > 0) throw new Error('Cannot delete this user while they have active requests they created')
      if (reviewedRequests > 0) throw new Error('Cannot delete this user while they have active requests they reviewed')
      if (approvedRequests > 0) throw new Error('Cannot delete this user while they have active requests they approved')
      if (purchasedRequests > 0) throw new Error('Cannot delete this user while they have active requests they purchased')
      if (inventoryCount > 0) throw new Error('Cannot delete this user while they are referenced by inventory records')

      await target.destroy({ user_id: user.id })
      return true
    } catch (error) {
      return error
    }
  }
}
