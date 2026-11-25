'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('items', 'is_approved', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
    await queryInterface.addColumn('items', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('items', 'created_by')
    await queryInterface.removeColumn('items', 'is_approved')
  }
}
