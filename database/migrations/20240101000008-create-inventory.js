'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'requests', key: 'id' },
        onDelete: 'SET NULL'
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'items', key: 'id' },
        onDelete: 'SET NULL'
      },
      item_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'vendors', key: 'id' },
        onDelete: 'SET NULL'
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onDelete: 'SET NULL'
      },
      purchased_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      purchased_at: {
        type: Sequelize.DATE,
        allowNull: false
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
    await queryInterface.dropTable('inventory')
  }
}
