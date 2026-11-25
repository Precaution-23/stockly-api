'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('items', 'department_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onDelete: 'SET NULL'
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('items', 'department_id')
  }
}
