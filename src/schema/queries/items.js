const { GraphQLList, GraphQLInputObjectType, GraphQLString, GraphQLBoolean } = require('graphql')
const { Op } = require('sequelize')
const ItemType = require('../types/itemType')
const db = require('../../../database/models')

const itemsQueryInput = new GraphQLInputObjectType({
  name: 'ItemsQueryInput',
  fields: () => ({
    q: { type: GraphQLString },
    approved: { type: GraphQLBoolean }
  })
})

module.exports = {
  type: new GraphQLList(ItemType),
  args: { payload: { type: itemsQueryInput } },
  async resolve(_, { payload }, context) {
    try {
      await context()
      const where = {}
      if (payload && payload.q) {
        where.name = { [Op.iLike]: `%${payload.q}%` }
      }
      if (payload && typeof payload.approved === 'boolean') {
        where.is_approved = payload.approved
      }
      return db.Item.findAll({ where, order: [['createdAt', 'DESC']] })
    } catch (error) {
      return error
    }
  }
}
