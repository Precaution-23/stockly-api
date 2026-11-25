'use strict'

// Record which department first issued numbers for each prefix, so another department
// can't later take over that prefix and continue its series.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory_sequences', 'department_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onDelete: 'SET NULL'
    })
    await queryInterface.sequelize.query(
      `UPDATE inventory_sequences s SET department_id = d.id
       FROM departments d WHERE d.inventory_prefix = s.prefix`
    )
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('inventory_sequences', 'department_id')
  }
}
