'use strict'

// The seed inserted roles with explicit ids without advancing roles_id_seq, so creating a
// role could collide with an existing id ("id must be unique"). Move the sequence past MAX(id).
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles))`
    )
  },

  async down() {
    // Nothing to undo
  }
}
