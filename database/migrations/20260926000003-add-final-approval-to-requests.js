'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_requests_status" ADD VALUE IF NOT EXISTS 'awaiting_final_approval';`
    )
    await queryInterface.addColumn('requests', 'final_approver_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    })
    await queryInterface.addColumn('requests', 'final_approved_at', {
      type: Sequelize.DATE,
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('requests', 'final_approved_at')
    await queryInterface.removeColumn('requests', 'final_approver_id')
    // Postgres cannot drop a value from an enum type, so 'awaiting_final_approval'
    // stays on "enum_requests_status". Move any such requests back to 'forwarded'.
    await queryInterface.sequelize.query(
      `UPDATE requests SET status = 'forwarded' WHERE status = 'awaiting_final_approval';`
    )
  }
}
