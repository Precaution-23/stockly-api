const { GraphQLList, GraphQLInputObjectType, GraphQLString } = require('graphql')
const AuditLogType = require('../types/auditLogType')
const db = require('../../../database/models')
const { assertPermission } = require('../../helpers/requestAuth')

const auditLogsQueryInput = new GraphQLInputObjectType({
  name: 'AuditLogsQueryInput',
  fields: () => ({
    model: { type: GraphQLString },
    action_type: { type: GraphQLString }
  })
})

module.exports = {
  type: new GraphQLList(AuditLogType),
  args: { payload: { type: auditLogsQueryInput } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      assertPermission(user, 'AuditLogs', 'read')
      const where = {}
      if (payload && payload.model) where.model = payload.model
      if (payload && payload.action_type) where.action_type = payload.action_type
      return db.AuditLog.findAll({ where, order: [['createdAt', 'DESC']], limit: 200 })
    } catch (error) {
      return error
    }
  }
}
