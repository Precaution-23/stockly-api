const { GraphQLList, GraphQLInputObjectType, GraphQLString } = require('graphql')
const { Op } = require('sequelize')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')
const { assertGroup } = require('../../helpers/requestAuth')

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
      // Everyone's requests are only for the approval workflow groups; requesters use myRequests
      assertGroup(user, ['admin', 'operation', 'finance', 'approver'])
      const where = {}

      const statusFilters = []
      if (payload && payload.status) statusFilters.push({ status: payload.status })
      // Finance cannot see pending requests, even when filtering by status
      if (user.group_name === 'finance') statusFilters.push({ status: { [Op.ne]: 'pending' } })
      // Final Approvers only see requests waiting for final approval
      if (user.group_name === 'approver') statusFilters.push({ status: 'awaiting_final_approval' })
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
