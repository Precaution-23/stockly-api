'use strict'

const { RESOURCES } = require('../../src/helpers/resources')

// Roles created before createRole seeded permission rows have none, which leaves their
// permission grid uneditable. Insert any missing (role, resource) rows, all denied.
module.exports = {
  async up(queryInterface) {
    const roles = await queryInterface.sequelize.query(
      'SELECT id FROM roles WHERE deleted_at IS NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )
    const existing = await queryInterface.sequelize.query(
      'SELECT role_id, resource FROM permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )
    const have = new Set(existing.map((p) => `${p.role_id}:${p.resource}`))
    const now = new Date()
    const rows = []
    for (const role of roles) {
      for (const resource of RESOURCES) {
        if (!have.has(`${role.id}:${resource}`)) {
          rows.push({ role_id: role.id, resource, create: false, read: false, update: false, delete: false, createdAt: now, updatedAt: now })
        }
      }
    }
    if (rows.length) await queryInterface.bulkInsert('permissions', rows)
  },

  async down() {
    // Backfilled rows are indistinguishable from real ones; nothing to undo
  }
}
