'use strict'

const { RESOURCES } = require('../../src/helpers/resources')

// New "approver" group: users who only give final approval on requests (see approval rules).
// Also creates a matching "Final Approver" role with no resource permissions; what they can do
// comes from the group, so the menu shows only their approvals.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_users_group_name" ADD VALUE IF NOT EXISTS 'approver'`)

    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'Final Approver' AND deleted_at IS NULL`
    )
    if (existing.length) return

    const now = new Date()
    const [[role]] = await queryInterface.sequelize.query(
      `INSERT INTO roles (name, description, "createdAt", "updatedAt")
       VALUES ('Final Approver', 'Gives the final approval on requests above an approval-rule amount', :now, :now)
       RETURNING id`,
      { replacements: { now } }
    )
    await queryInterface.bulkInsert(
      'permissions',
      RESOURCES.map((resource) => ({
        role_id: role.id, resource, create: false, read: false, update: false, delete: false, createdAt: now, updatedAt: now
      }))
    )
  },

  async down() {
    // Postgres can't drop an enum value; the role is left in place too
  }
}
