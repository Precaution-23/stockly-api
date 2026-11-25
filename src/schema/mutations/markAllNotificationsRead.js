const { GraphQLInt } = require('graphql')
const db = require('../../../database/models')

module.exports = {
  type: GraphQLInt,
  async resolve(_, __, context) {
    try {
      const { user } = await context()
      const [count] = await db.Notification.update(
        { read_at: new Date() },
        { where: { user_id: user.id, read_at: null } }
      )
      return count
    } catch (error) {
      return error
    }
  }
}
