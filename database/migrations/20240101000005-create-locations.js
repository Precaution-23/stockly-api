'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('locations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('locations')
  }
}
