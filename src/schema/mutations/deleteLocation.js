const { GraphQLNonNull, GraphQLID, GraphQLBoolean } = require('graphql')
const db = require('../../../database/models')
const { assertPermission } = require('../../helpers/requestAuth')

module.exports = {
  type: GraphQLBoolean,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      assertPermission(user, 'Locations', 'delete')
      const location = await db.Location.findByPk(id)
      if (!location) throw new Error('Location not found')

      const [childCount, requestCount, inventoryCount] = await Promise.all([
        db.Location.count({ where: { parent_id: id } }),
        db.Request.count({ where: { location_id: id } }),
        db.Inventory.count({ where: { location_id: id } })
      ])
      if (childCount > 0) throw new Error('Cannot delete this location while it has child locations')
      if (requestCount > 0) throw new Error('Cannot delete this location while it is referenced by active requests')
      if (inventoryCount > 0) throw new Error('Cannot delete this location while it is referenced by inventory records')

      await location.destroy({ user_id: user.id })
      return true
    } catch (error) {
      return error
    }
  }
}
