const {
  GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString,
  GraphQLInt, GraphQLFloat
} = require('graphql')
const DateType = require('./dateType')
const db = require('../../../database/models')

const InventoryType = new GraphQLObjectType({
  name: 'Inventory',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    request_id: { type: GraphQLID },
    item_id: { type: GraphQLID },
    item_name: { type: new GraphQLNonNull(GraphQLString) },
    quantity: { type: new GraphQLNonNull(GraphQLInt) },
    unit_price: { type: new GraphQLNonNull(GraphQLFloat) },
    total_price: { type: new GraphQLNonNull(GraphQLFloat) },
    vendor_id: { type: GraphQLID },
    location_id: { type: GraphQLID },
    purchased_by: { type: GraphQLID },
    created_by: { type: GraphQLID },
    purchased_at: { type: DateType },
    invoice: { type: GraphQLString },
    inventory_number: { type: GraphQLString },
    item: {
      type: require('./itemType'),
      async resolve(parent) {
        if (!parent.item_id) return null
        return db.Item.findByPk(parent.item_id)
      }
    },
    vendor: {
      type: require('./vendorType'),
      async resolve(parent) {
        if (!parent.vendor_id) return null
        return db.Vendor.findByPk(parent.vendor_id)
      }
    },
    location: {
      type: require('./locationType'),
      async resolve(parent) {
        if (!parent.location_id) return null
        return db.Location.findByPk(parent.location_id)
      }
    },
    purchaser: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.purchased_by) return null
        return db.User.findByPk(parent.purchased_by)
      }
    },
    creator: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.created_by) return null
        return db.User.findByPk(parent.created_by)
      }
    },
    // Whoever gave the request its final approval: the final approver when that step applied, else finance
    approver: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.request_id) return null
        const request = await db.Request.findByPk(parent.request_id, {
          attributes: ['approved_by', 'final_approved_by'],
          paranoid: false
        })
        const approverId = request?.final_approved_by || request?.approved_by
        return approverId ? db.User.findByPk(approverId) : null
      }
    },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = InventoryType
