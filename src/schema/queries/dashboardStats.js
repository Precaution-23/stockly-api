const DashboardStatsType = require('../types/dashboardStatsType')
const db = require('../../../database/models')
const { hasPermission } = require('../../helpers/requestAuth')

module.exports = {
  type: DashboardStatsType,
  async resolve(_, __, context) {
    try {
      const { user } = await context()

      // Same audience as the all-requests list: workflow groups see church-wide figures,
      // everyone else sees figures for their own requests only
      const scope = ['admin', 'operation', 'finance'].includes(user.group_name) ? 'all' : 'mine'
      const mine = scope === 'mine' ? { created_by: user.id } : {}
      const count = (status) => db.Request.count({ where: { ...mine, ...(status ? { status } : {}) } })

      const canSeeInventory = hasPermission(user, 'Inventory', 'read')
      // Recent activity is audit-log data: only roles with AuditLogs read get it
      const canSeeActivity = hasPermission(user, 'AuditLogs', 'read')

      const [
        totalRequests,
        pendingRequests,
        forwardedRequests,
        awaitingFinalApprovalRequests,
        approvedRequests,
        rejectedRequests,
        purchasedRequests,
        totalInventoryItems,
        inventoryRows,
        recentActivity,
        recentRequests
      ] = await Promise.all([
        count(),
        count('pending'),
        count('forwarded'),
        count('awaiting_final_approval'),
        count('approved'),
        count('rejected'),
        count('purchased'),
        canSeeInventory ? db.Inventory.count() : null,
        canSeeInventory ? db.Inventory.findAll({ attributes: ['total_price'] }) : null,
        canSeeActivity ? db.AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: 10 }) : null,
        db.Request.findAll({ where: { created_by: user.id }, order: [['createdAt', 'DESC']], limit: 5 })
      ])

      const totalInventoryValue = inventoryRows
        ? inventoryRows.reduce((sum, row) => sum + Number(row.total_price || 0), 0)
        : null

      return {
        scope,
        totalRequests,
        pendingRequests,
        forwardedRequests,
        awaitingFinalApprovalRequests,
        approvedRequests,
        rejectedRequests,
        purchasedRequests,
        totalInventoryItems,
        totalInventoryValue,
        recentActivity,
        recentRequests
      }
    } catch (error) {
      return error
    }
  }
}
