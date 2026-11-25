'use strict'

// Who actually gave the final approval (the assignee, or an admin acting as fallback)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('requests', 'final_approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    })
    // Before this column existed the approver wasn't stored; the assignee is the best record
    await queryInterface.sequelize.query(
      'UPDATE requests SET final_approved_by = final_approver_id WHERE final_approved_at IS NOT NULL'
    )
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('requests', 'final_approved_by')
  }
}
