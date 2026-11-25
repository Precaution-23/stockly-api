const { GraphQLNonNull, GraphQLID, GraphQLBoolean } = require('graphql')
const db = require('../../../database/models')

module.exports = {
  type: GraphQLBoolean,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      const item = await db.Item.findByPk(id)
      if (!item) throw new Error('Item not found')

      const [requestCount, inventoryCount] = await Promise.all([
        db.Request.count({ where: { item_id: id } }),
        db.Inventory.count({ where: { item_id: id } })
      ])
      if (requestCount > 0) throw new Error('Cannot delete this item while it is referenced by active requests')
      if (inventoryCount > 0) throw new Error('Cannot delete this item while it is referenced by inventory records')

      await item.destroy({ user_id: user.id })
      return true
    } catch (error) {
      return error
    }
  }
}
