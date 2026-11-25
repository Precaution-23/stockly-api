'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class AuditLog extends Model {
  static associate(models) {
    AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
  }
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    action_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    diff: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs'
  }
)

module.exports = AuditLog
