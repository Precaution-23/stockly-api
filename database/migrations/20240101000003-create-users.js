'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      group_name: {
        type: Sequelize.ENUM('admin', 'operation', 'finance', 'requester'),
        allowNull: false,
        defaultValue: 'requester'
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'roles', key: 'id' },
        onDelete: 'SET NULL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.dropTable('users')
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_group_name";')
  }
}
