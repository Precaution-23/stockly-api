const { Op } = require('sequelize')
const { InventoryPageType } = require('../types/pageTypes')
const db = require('../../../database/models')
const { assertPermission } = require('../../helpers/requestAuth')
const { pageInput, pageWindow, pageOrder, likeTerm } = require('../../helpers/paging')

const SORTABLE = {
  inventory_number: 'inventory_number',
  item_name: 'item_name',
  quantity: 'quantity',
  unit_price: 'unit_price',
  total_price: 'total_price',
  purchased_at: 'purchased_at',
  createdAt: 'createdAt'
}

// Paged, searchable inventory (search matches item name or inventory number)
module.exports = {
  type: InventoryPageType,
  args: { payload: { type: pageInput('InventoryPageInput') } },
  async resolve(_, { payload = {} }, context) {
    try {
      const { user } = await context()
      assertPermission(user, 'Inventory', 'read')

      const where = {}
      if (payload.q && payload.q.trim()) {
        const term = likeTerm(payload.q)
        where[Op.or] = [{ item_name: { [Op.iLike]: term } }, { inventory_number: { [Op.iLike]: term } }]
      }
      const { limit, offset } = pageWindow(payload)

      const [{ rows, count }, totalValue] = await Promise.all([
        db.Inventory.findAndCountAll({ where, order: pageOrder(payload, SORTABLE), limit, offset }),
        db.Inventory.sum('total_price', { where })
      ])
      return { rows, total: count, totalValue: String(totalValue || 0) }
    } catch (error) {
      return error
    }
  }
}
