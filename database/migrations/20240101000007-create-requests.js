'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requests', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
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
      needed_by_date: {
        type: Sequelize.DATE,
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
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      invoice_1: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      invoice_2: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      invoice_3: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'forwarded', 'approved', 'rejected', 'purchased'),
        allowNull: false,
        defaultValue: 'pending'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
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
        allowNull: true
      },
      rejection_note: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('requests')
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_requests_status";')
  }
}
