'use strict'

// Final Approvers reach their approvals through Manage Requests, which needs Requests read + update.
// Their group limits that list to requests awaiting final approval. Other pages stay off by default
// and can be granted on the role like any other.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE permissions SET read = true, update = true, "updatedAt" = NOW()
      WHERE resource = 'Requests'
        AND role_id IN (SELECT id FROM roles WHERE name = 'Final Approver' AND deleted_at IS NULL)
    `)
  },

  async down() {}
}
