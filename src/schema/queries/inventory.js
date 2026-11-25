const { GraphQLList } = require('graphql')
const InventoryType = require('../types/inventoryType')
const db = require('../../../database/models')
const { assertPermission } = require('../../helpers/requestAuth')

module.exports = {
  type: new GraphQLList(InventoryType),
  async resolve(_, __, context) {
    try {
      const { user } = await context()
      assertPermission(user, 'Inventory', 'read')
      return db.Inventory.findAll({ order: [['createdAt', 'DESC']] })
    } catch (error) {
      return error
    }
  }
}
