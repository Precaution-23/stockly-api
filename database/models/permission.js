'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Permission extends Model {
  static associate(models) {
    Permission.belongsTo(models.Role, { foreignKey: 'role_id' })
  }

  async auditDescription() {
    return `${this.resource}`
  }
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'roles', key: 'id' }
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false
    },
    create: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    update: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions'
  }
)

module.exports = Permission
