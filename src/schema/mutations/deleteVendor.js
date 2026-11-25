const { GraphQLNonNull, GraphQLID, GraphQLBoolean } = require('graphql')
const db = require('../../../database/models')

module.exports = {
  type: GraphQLBoolean,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      const vendor = await db.Vendor.findByPk(id)
      if (!vendor) throw new Error('Vendor not found')

      const [requestCount, inventoryCount] = await Promise.all([
        db.Request.count({ where: { vendor_id: id } }),
        db.Inventory.count({ where: { vendor_id: id } })
      ])
      if (requestCount > 0) throw new Error('Cannot delete this vendor while it is referenced by active requests')
      if (inventoryCount > 0) throw new Error('Cannot delete this vendor while it is referenced by inventory records')

      await vendor.destroy({ user_id: user.id })
      return true
    } catch (error) {
      return error
    }
  }
}
