'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Item extends Model {
  static associate(models) {
    Item.hasMany(models.Request, { foreignKey: 'item_id' })
    Item.hasMany(models.Inventory, { foreignKey: 'item_id' })
    Item.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' })
    Item.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' })
  }

  async auditDescription() {
    return `${this.name}`
  }
}

Item.init(
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
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'id' }
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Item',
    tableName: 'items',
    paranoid: true,
    deletedAt: 'deleted_at'
  }
)

Item.audit = { enabled: true, name: 'item' }

module.exports = Item
