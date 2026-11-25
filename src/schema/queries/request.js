const { GraphQLNonNull, GraphQLID } = require('graphql')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')
const { canViewRequest } = require('../../helpers/requestAuth')

// A single request (used by email/notification deep links)
module.exports = {
  type: RequestType,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      const request = await db.Request.findByPk(id)
      // Same error whether missing or hidden, so ids can't be probed
      if (!request || !canViewRequest(user, request)) throw new Error('Request not found')
      return request
    } catch (error) {
      return error
    }
  }
}
