const { GraphQLNonNull, GraphQLID, GraphQLBoolean } = require('graphql')
const db = require('../../../database/models')
const { hasPermission } = require('../../helpers/requestAuth')

module.exports = {
  type: GraphQLBoolean,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      const request = await db.Request.findByPk(id)
      if (!request) throw new Error('Request not found')
      const ownPending = String(request.created_by) === String(user.id) && request.status === 'pending'
      if (!ownPending && !hasPermission(user, 'Requests', 'delete')) throw new Error('Not authorized')

      const inventoryCount = await db.Inventory.count({ where: { request_id: id } })
      if (inventoryCount > 0) throw new Error('Cannot delete this request while it has associated inventory records')

      await request.destroy({ user_id: user.id })
      return true
    } catch (error) {
      return error
    }
  }
}
