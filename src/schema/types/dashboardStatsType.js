const {
  GraphQLObjectType, GraphQLInt, GraphQLFloat, GraphQLList
} = require('graphql')

const DashboardStatsType = new GraphQLObjectType({
  name: 'DashboardStats',
  fields: () => ({
    totalRequests: { type: GraphQLInt },
    pendingRequests: { type: GraphQLInt },
    forwardedRequests: { type: GraphQLInt },
    awaitingFinalApprovalRequests: { type: GraphQLInt },
    approvedRequests: { type: GraphQLInt },
    rejectedRequests: { type: GraphQLInt },
    purchasedRequests: { type: GraphQLInt },
    totalInventoryItems: { type: GraphQLInt },
    totalInventoryValue: { type: GraphQLFloat },
    recentActivity: {
      type: new GraphQLList(require('./auditLogType'))
    }
  })
})

module.exports = DashboardStatsType
