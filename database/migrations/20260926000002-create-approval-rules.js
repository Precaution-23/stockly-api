'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('approval_rules', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      min_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      max_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      approver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('approval_rules')
  }
}
