const { GraphQLList, GraphQLInputObjectType, GraphQLString } = require('graphql')
const { Op } = require('sequelize')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')

const requestsQueryInput = new GraphQLInputObjectType({
  name: 'RequestsQueryInput',
  fields: () => ({
    q: { type: GraphQLString },
    status: { type: GraphQLString }
  })
})

module.exports = {
  type: new GraphQLList(RequestType),
  args: { payload: { type: requestsQueryInput } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      const where = {}

      const statusFilters = []
      if (payload && payload.status) statusFilters.push({ status: payload.status })
      // Finance cannot see pending requests, even when filtering by status
      if (user.group_name === 'finance') statusFilters.push({ status: { [Op.ne]: 'pending' } })
      if (statusFilters.length) where[Op.and] = statusFilters

      if (payload && payload.q) {
        where.item_name = { [Op.iLike]: `%${payload.q}%` }
      }

      return db.Request.findAll({ where, order: [['createdAt', 'DESC']] })
    } catch (error) {
      return error
    }
  }
}
