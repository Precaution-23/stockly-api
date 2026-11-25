const { GraphQLList } = require('graphql')
const InventoryType = require('../types/inventoryType')
const db = require('../../../database/models')

module.exports = {
  type: new GraphQLList(InventoryType),
  async resolve(_, __, context) {
    try {
      await context()
      return db.Inventory.findAll({ order: [['createdAt', 'DESC']] })
    } catch (error) {
      return error
    }
  }
}
