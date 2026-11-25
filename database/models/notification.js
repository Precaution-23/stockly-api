'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Notification extends Model {
  static associate(models) {
    Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
  }
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications'
  }
)

module.exports = Notification
