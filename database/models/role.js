'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Role extends Model {
  static associate(models) {
    Role.hasMany(models.User, { foreignKey: 'role_id' })
    Role.hasMany(models.Permission, { foreignKey: 'role_id' })
  }

  async auditDescription() {
    return `${this.name}`
  }
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    paranoid: true,
    deletedAt: 'deleted_at'
  }
)

Role.audit = { enabled: true, name: 'role' }

module.exports = Role
