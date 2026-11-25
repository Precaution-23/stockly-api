'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class TokenBlacklist extends Model {}

TokenBlacklist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'TokenBlacklist',
    tableName: 'token_blacklists'
  }
)

module.exports = TokenBlacklist
