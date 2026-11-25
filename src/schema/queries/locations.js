const { GraphQLList, GraphQLInputObjectType, GraphQLString } = require('graphql')
const { Op } = require('sequelize')
const LocationType = require('../types/locationType')
const db = require('../../../database/models')

const locationsQueryInput = new GraphQLInputObjectType({
  name: 'LocationsQueryInput',
  fields: () => ({
    q: { type: GraphQLString }
  })
})

module.exports = {
  type: new GraphQLList(LocationType),
  args: { payload: { type: locationsQueryInput } },
  async resolve(_, { payload }, context) {
    try {
      await context()
      const where = {}
      if (payload && payload.q) {
        where.name = { [Op.iLike]: `%${payload.q}%` }
      }
      return db.Location.findAll({ where, order: [['createdAt', 'DESC']] })
    } catch (error) {
      return error
    }
  }
}
