const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString } = require('graphql')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')
const notifications = require('../../helpers/notifications')
const { assertGroup, assertNotOwnRequest, canFinalApprove } = require('../../helpers/requestAuth')

const rejectRequestInput = new GraphQLInputObjectType({
  name: 'RejectRequestInput',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    rejection_note: { type: GraphQLString }
  })
})

module.exports = {
  type: RequestType,
  args: { payload: { type: new GraphQLNonNull(rejectRequestInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      const request = await db.Request.findByPk(payload.id)
      if (!request) throw new Error('Request not found')
      assertNotOwnRequest(user, request)
      if (!['pending', 'forwarded', 'awaiting_final_approval', 'approved'].includes(request.status)) {
        throw new Error('Request cannot be rejected in its current status')
      }

      if (request.status === 'pending') assertGroup(user, ['admin', 'operation'])
      if (['forwarded', 'approved'].includes(request.status)) assertGroup(user, ['admin', 'finance'])
      if (request.status === 'awaiting_final_approval' && !canFinalApprove(user, request)) {
        throw new Error('Not authorized')
      }

      await request.update(
        { status: 'rejected', rejection_note: payload.rejection_note || null },
        { user_id: user.id }
      )

      if (request.created_by) {
        const creator = await db.User.findByPk(request.created_by)
        if (creator) notifications.requestRejected(creator, request, payload.rejection_note).catch(console.error)
      }

      return request
    } catch (error) {
      return error
    }
  }
}
