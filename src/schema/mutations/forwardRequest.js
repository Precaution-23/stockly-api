const { GraphQLNonNull, GraphQLID } = require('graphql')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')
const notifications = require('../../helpers/notifications')
const { assertGroup } = require('../../helpers/requestAuth')

module.exports = {
  type: RequestType,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      assertGroup(user, ['admin', 'operation'])
      const request = await db.Request.findByPk(id)
      if (!request) throw new Error('Request not found')
      if (request.status !== 'pending') throw new Error('Only pending requests can be forwarded')

      await request.update(
        { status: 'forwarded', reviewed_by: user.id },
        { user_id: user.id }
      )

      const financeUsers = await db.User.findAll({ where: { group_name: 'finance', is_active: true } })
      notifications.requestForwarded(financeUsers, request).catch(console.error)

      return request
    } catch (error) {
      return error
    }
  }
}
