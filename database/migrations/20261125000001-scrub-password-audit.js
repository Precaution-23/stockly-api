'use strict'

// Earlier audit entries for users stored old/new password hashes in the diff. Replace them.
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, diff FROM audit_logs WHERE model = 'User' AND diff LIKE '%"password"%'`
    )
    for (const row of rows) {
      let diff
      try { diff = JSON.parse(row.diff) } catch { continue }
      if (!diff || !diff.password) continue
      diff.password = ['[hidden]', '[changed]']
      await queryInterface.sequelize.query('UPDATE audit_logs SET diff = :diff WHERE id = :id', {
        replacements: { diff: JSON.stringify(diff), id: row.id }
      })
    }
  },

  async down() {}
}
