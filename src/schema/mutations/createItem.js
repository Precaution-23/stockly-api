const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString } = require('graphql')
const ItemType = require('../types/itemType')
const db = require('../../../database/models')

const createItemInput = new GraphQLInputObjectType({
  name: 'CreateItemInput',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    department_id: { type: GraphQLID }
  })
})

module.exports = {
  type: ItemType,
  args: { payload: { type: new GraphQLNonNull(createItemInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      const { id, name, description, department_id } = payload
      if (id) {
        const item = await db.Item.findByPk(id)
        return item.update({ name, description, department_id: department_id || null }, { user_id: user.id })
      }
      return db.Item.create(
        { name, description, department_id: department_id || null, is_approved: true, created_by: user.id },
        { user_id: user.id }
      )
    } catch (error) {
      return error
    }
  }
}
