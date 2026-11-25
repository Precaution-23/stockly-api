const {
  GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString,
  GraphQLInt, GraphQLFloat
} = require('graphql')
const DateType = require('./dateType')
const db = require('../../../database/models')

const RequestType = new GraphQLObjectType({
  name: 'Request',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    item_id: { type: GraphQLID },
    item_name: { type: new GraphQLNonNull(GraphQLString) },
    quantity: { type: new GraphQLNonNull(GraphQLInt) },
    unit_price: { type: new GraphQLNonNull(GraphQLFloat) },
    total_price: {
      type: GraphQLFloat,
      resolve(parent) {
        return Number(parent.unit_price) * parent.quantity
      }
    },
    needed_by_date: { type: DateType },
    vendor_id: { type: GraphQLID },
    location_id: { type: GraphQLID },
    description: { type: GraphQLString },
    invoice_1: { type: GraphQLString },
    invoice_2: { type: GraphQLString },
    invoice_3: { type: GraphQLString },
    purchase_invoice: { type: GraphQLString },
    status: { type: new GraphQLNonNull(GraphQLString) },
    rejection_note: { type: GraphQLString },
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
    creator: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.created_by) return null
        return db.User.findByPk(parent.created_by)
      }
    },
    reviewer: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.reviewed_by) return null
        return db.User.findByPk(parent.reviewed_by)
      }
    },
    approver: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.approved_by) return null
        return db.User.findByPk(parent.approved_by)
      }
    },
    purchaser: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.purchased_by) return null
        return db.User.findByPk(parent.purchased_by)
      }
    },
    purchased_at: { type: DateType },
    final_approver_id: { type: GraphQLID },
    finalApprover: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.final_approver_id) return null
        return db.User.findByPk(parent.final_approver_id)
      }
    },
    final_approved_at: { type: DateType },
    final_approved_by: { type: GraphQLID },
    finalApprovedBy: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.final_approved_by) return null
        return db.User.findByPk(parent.final_approved_by)
      }
    },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = RequestType
