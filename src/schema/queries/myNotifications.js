const { GraphQLInt } = require('graphql')
const { NotificationFeedType } = require('../types/notificationType')
const db = require('../../../database/models')

module.exports = {
  type: NotificationFeedType,
  args: { limit: { type: GraphQLInt, defaultValue: 20 } },
  async resolve(_, { limit }, context) {
    try {
      const { user } = await context()
      const [unread_count, items] = await Promise.all([
        db.Notification.count({ where: { user_id: user.id, read_at: null } }),
        db.Notification.findAll({
          where: { user_id: user.id },
          order: [['createdAt', 'DESC'], ['id', 'DESC']],
          limit: Math.min(Math.max(limit || 20, 1), 50)
        })
      ])
      return { unread_count, items }
    } catch (error) {
      return error
    }
  }
}
