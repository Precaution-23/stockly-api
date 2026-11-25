const { GraphQLNonNull, GraphQLID } = require('graphql')
const { NotificationType } = require('../types/notificationType')
const db = require('../../../database/models')

module.exports = {
  type: NotificationType,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      // Scoped to the caller, so other users' notifications are indistinguishable from missing ones
      const notification = await db.Notification.findOne({ where: { id, user_id: user.id } })
      if (!notification) throw new Error('Notification not found')
      if (!notification.read_at) await notification.update({ read_at: new Date() })
      return notification
    } catch (error) {
      return error
    }
  }
}
