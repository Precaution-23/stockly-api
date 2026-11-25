const { GraphQLNonNull, GraphQLID } = require('graphql')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')
const notifications = require('../../helpers/notifications')
const { assertGroup, requestTotal, findApprovalRule } = require('../../helpers/requestAuth')

async function notifyCreatorApproved(request) {
  if (!request.created_by) return
  const creator = await db.User.findByPk(request.created_by)
  if (creator) notifications.requestApproved(creator, request).catch(console.error)
}

module.exports = {
  type: RequestType,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      const request = await db.Request.findByPk(id)
      if (!request) throw new Error('Request not found')

      // Stage 1: finance approval, possibly escalating to a final approver
      if (request.status === 'forwarded') {
        assertGroup(user, ['admin', 'finance'])

        const rule = await findApprovalRule(requestTotal(request))
        if (rule) {
          await request.update(
            { status: 'awaiting_final_approval', approved_by: user.id, final_approver_id: rule.approver_id },
            { user_id: user.id }
          )
          const approver = await db.User.findByPk(rule.approver_id)
          if (approver) notifications.requestFinalApproval(approver, request).catch(console.error)
          return request
        }

        await request.update({ status: 'approved', approved_by: user.id }, { user_id: user.id })
        await notifyCreatorApproved(request)
        return request
      }

      // Stage 2: final approval by the assigned approver (admins as fallback)
      if (request.status === 'awaiting_final_approval') {
        if (String(request.final_approver_id) !== String(user.id) && user.group_name !== 'admin') {
          throw new Error('Not authorized')
        }

        await request.update(
          { status: 'approved', final_approved_at: new Date(), final_approved_by: user.id },
          { user_id: user.id }
        )
        await notifyCreatorApproved(request)
        return request
      }

      throw new Error('Only forwarded requests or requests awaiting final approval can be approved')
    } catch (error) {
      return error
    }
  }
}
