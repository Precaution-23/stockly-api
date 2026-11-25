const {
  GraphQLObjectType, GraphQLInt, GraphQLFloat, GraphQLList, GraphQLString
} = require('graphql')

const DashboardStatsType = new GraphQLObjectType({
  name: 'DashboardStats',
  fields: () => ({
    // 'all' = church-wide figures; 'mine' = only the logged-in user's requests
    scope: { type: GraphQLString },
    totalRequests: { type: GraphQLInt },
    pendingRequests: { type: GraphQLInt },
    forwardedRequests: { type: GraphQLInt },
    awaitingFinalApprovalRequests: { type: GraphQLInt },
    approvedRequests: { type: GraphQLInt },
    rejectedRequests: { type: GraphQLInt },
    purchasedRequests: { type: GraphQLInt },
    totalInventoryItems: { type: GraphQLInt },
    totalInventoryValue: { type: GraphQLFloat },
    // null when the user may not see inventory / audit data
    recentActivity: {
      type: new GraphQLList(require('./auditLogType'))
    },
    // The user's own latest requests (shown on the personal dashboard)
    recentRequests: {
      type: new GraphQLList(require('./requestType'))
    }
  })
})

module.exports = DashboardStatsType
