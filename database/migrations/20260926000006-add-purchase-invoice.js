'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('requests', 'purchase_invoice', {
      type: Sequelize.STRING(500),
      allowNull: true
    })
    await queryInterface.addColumn('inventory', 'invoice', {
      type: Sequelize.STRING(500),
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('inventory', 'invoice')
    await queryInterface.removeColumn('requests', 'purchase_invoice')
  }
}
