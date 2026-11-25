const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString } = require('graphql')
const { fn, col, where } = require('sequelize')
const ItemType = require('../types/itemType')
const db = require('../../../database/models')
const notifications = require('../../helpers/notifications')
const { getItemManagers } = require('../../helpers/itemManagers')

const requestNewItemInput = new GraphQLInputObjectType({
  name: 'RequestNewItemInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    department_id: { type: GraphQLID }
  })
})

module.exports = {
  type: ItemType,
  args: { payload: { type: new GraphQLNonNull(requestNewItemInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      const name = payload.name.trim()
      if (!name) throw new Error('Item name is required')

      const existing = await db.Item.findOne({
        where: where(fn('lower', col('name')), name.toLowerCase()),
        paranoid: false
      })
      if (existing) throw new Error('Item already exists')

      const item = await db.Item.create(
        {
          name,
          description: payload.description,
          department_id: payload.department_id || null,
          is_approved: false,
          created_by: user.id
        },
        { user_id: user.id }
      )

      // Notify item managers
      // Users who can approve items; admins if no role has that permission
      getItemManagers()
        .then(async (managers) => {
          if (!managers.length) managers = await db.User.findAll({ where: { group_name: 'admin', is_active: true } })
          return notifications.itemPendingApproval(managers, item, user)
        })
        .catch(console.error)

      return item
    } catch (error) {
      return error
    }
  }
}
