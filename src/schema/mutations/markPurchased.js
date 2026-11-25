const { GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')
const notifications = require('../../helpers/notifications')
const { assertGroup, assertNotOwnRequest } = require('../../helpers/requestAuth')
const { assertUploadPath } = require('../../helpers/uploads')
const { resolvePrefix, reserveNumbers } = require('../../helpers/inventoryNumber')

module.exports = {
  type: RequestType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    invoice: { type: new GraphQLNonNull(GraphQLString) }
  },
  async resolve(_, { id, invoice }, context) {
    try {
      const { user } = await context()
      assertGroup(user, ['admin', 'operation', 'finance'])
      assertUploadPath(invoice)

      const request = await db.sequelize.transaction(async (transaction) => {
        // Row lock so two concurrent purchases of the same request can't both pass the status check
        const request = await db.Request.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
        if (!request) throw new Error('Request not found')
        assertNotOwnRequest(user, request)
        if (request.status !== 'approved') throw new Error('Only approved requests can be marked as purchased')

        const now = new Date()
        await request.update(
          { status: 'purchased', purchased_by: user.id, purchased_at: now, purchase_invoice: invoice },
          { user_id: user.id, transaction }
        )

        // One inventory record per unit, each with its own inventory number
        const { prefix, departmentId } = await resolvePrefix(request.item_id, transaction)
        const numbers = await reserveNumbers(prefix, request.quantity, transaction, departmentId)
        for (const inventory_number of numbers) {
          await db.Inventory.create(
            {
              request_id: request.id,
              item_id: request.item_id,
              item_name: request.item_name,
              quantity: 1,
              unit_price: request.unit_price,
              total_price: request.unit_price,
              vendor_id: request.vendor_id,
              location_id: request.location_id,
              purchased_by: user.id,
              created_by: request.created_by,
              purchased_at: now,
              invoice,
              inventory_number
            },
            { user_id: user.id, transaction }
          )
        }
        return request
      })

      if (request.created_by) {
        const creator = await db.User.findByPk(request.created_by)
        if (creator) notifications.requestPurchased(creator, request).catch(console.error)
      }

      return request
    } catch (error) {
      return error
    }
  }
}
