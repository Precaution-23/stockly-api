'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('requests', 'last_reminded_at', { type: Sequelize.DATE, allowNull: true })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('requests', 'last_reminded_at')
  }
}
