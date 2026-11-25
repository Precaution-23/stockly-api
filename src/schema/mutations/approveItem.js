const { GraphQLNonNull, GraphQLID } = require('graphql')
const ItemType = require('../types/itemType')
const db = require('../../../database/models')
const notifications = require('../../helpers/notifications')
const { canManageItems } = require('../../helpers/itemManagers')

module.exports = {
  type: ItemType,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      if (!canManageItems(user)) throw new Error('Not authorized')

      const item = await db.Item.findByPk(id)
      if (!item) throw new Error('Item not found')
      if (item.is_approved) throw new Error('Item is already approved')

      await item.update({ is_approved: true }, { user_id: user.id })

      if (item.created_by) {
        const creator = await db.User.findByPk(item.created_by)
        if (creator) notifications.itemApproved(creator, item).catch(console.error)
      }

      return item
    } catch (error) {
      return error
    }
  }
}
