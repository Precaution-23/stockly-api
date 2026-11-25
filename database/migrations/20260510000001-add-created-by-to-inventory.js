'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('inventory', 'created_by')
  }
}
