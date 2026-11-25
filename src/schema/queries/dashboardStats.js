const { Op } = require('sequelize')
const DashboardStatsType = require('../types/dashboardStatsType')
const db = require('../../../database/models')
const { hasPermission } = require('../../helpers/requestAuth')

module.exports = {
  type: DashboardStatsType,
  async resolve(_, __, context) {
    try {
      const { user } = await context()
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
        recentActivity
      ] = await Promise.all([
        db.Request.count(),
        db.Request.count({ where: { status: 'pending' } }),
        db.Request.count({ where: { status: 'forwarded' } }),
        db.Request.count({ where: { status: 'awaiting_final_approval' } }),
        db.Request.count({ where: { status: 'approved' } }),
        db.Request.count({ where: { status: 'rejected' } }),
        db.Request.count({ where: { status: 'purchased' } }),
        db.Inventory.count(),
        db.Inventory.findAll({ attributes: ['total_price'] }),
        canSeeActivity ? db.AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: 10 }) : []
      ])

      const totalInventoryValue = inventoryRows.reduce(
        (sum, row) => sum + Number(row.total_price || 0),
        0
      )

      return {
        totalRequests,
        pendingRequests,
        forwardedRequests,
        awaitingFinalApprovalRequests,
        approvedRequests,
        rejectedRequests,
        purchasedRequests,
        totalInventoryItems,
        totalInventoryValue,
        recentActivity
      }
    } catch (error) {
      return error
    }
  }
}
