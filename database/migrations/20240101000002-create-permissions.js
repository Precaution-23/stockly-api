'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE'
      },
      resource: {
        type: Sequelize.STRING,
        allowNull: false
      },
      create: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      update: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      delete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('permissions')
  }
}
