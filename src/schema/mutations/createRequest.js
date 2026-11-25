const {
  GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString,
  GraphQLInt, GraphQLFloat
} = require('graphql')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')
const notifications = require('../../helpers/notifications')
const { assertUploadPath } = require('../../helpers/uploads')

const createRequestInput = new GraphQLInputObjectType({
  name: 'CreateRequestInput',
  fields: () => ({
    item_id: { type: GraphQLID },
    item_name: { type: new GraphQLNonNull(GraphQLString) },
    quantity: { type: new GraphQLNonNull(GraphQLInt) },
    unit_price: { type: new GraphQLNonNull(GraphQLFloat) },
    needed_by_date: { type: new GraphQLNonNull(GraphQLString) },
    vendor_id: { type: GraphQLID },
    location_id: { type: GraphQLID },
    description: { type: GraphQLString },
    invoice_1: { type: GraphQLString },
    invoice_2: { type: GraphQLString },
    invoice_3: { type: GraphQLString }
  })
})

async function activeUsersInGroup(group, excludeId) {
  const users = await db.User.findAll({ where: { group_name: group, is_active: true } })
  return users.filter((u) => String(u.id) !== String(excludeId))
}

async function notifyRequestCreated(request, creator) {
  let reviewers = await activeUsersInGroup('operation', creator.id)
  if (!reviewers.length) reviewers = await activeUsersInGroup('admin', creator.id)
  if (reviewers.length) await notifications.requestCreated(reviewers, request, creator)
  else console.warn(`No active Operation or Admin users to review request ${request.id}`)
  await notifications.requestSubmitted(creator, request)
}

module.exports = {
  type: RequestType,
  args: { payload: { type: new GraphQLNonNull(createRequestInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      // Optional references: treat empty strings as "not selected"
      const item_id = payload.item_id || null
      const vendor_id = payload.vendor_id || null
      const location_id = payload.location_id || null
      // Quotations must reference files uploaded via POST /uploads
      const [invoice_1, invoice_2, invoice_3] = ['invoice_1', 'invoice_2', 'invoice_3'].map((k) =>
        payload[k] ? assertUploadPath(payload[k]) : null
      )
      const request = await db.Request.create(
        {
          ...payload, item_id, vendor_id, location_id, invoice_1, invoice_2, invoice_3,
          created_by: user.id, status: 'pending'
        },
        { user_id: user.id }
      )

      // Notify reviewers (Operation; admins if there are none) and confirm to the requester
      notifyRequestCreated(request, user).catch(console.error)

      return request
    } catch (error) {
      return error
    }
  }
}
