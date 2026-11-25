'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Inventory extends Model {
  static associate(models) {
    Inventory.belongsTo(models.Request, { foreignKey: 'request_id', as: 'request' })
    Inventory.belongsTo(models.Item, { foreignKey: 'item_id', as: 'item' })
    Inventory.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' })
    Inventory.belongsTo(models.Location, { foreignKey: 'location_id', as: 'location' })
    Inventory.belongsTo(models.User, { foreignKey: 'purchased_by', as: 'purchaser' })
    Inventory.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' })
  }

  async auditDescription() {
    return `Inventory: ${this.item_name}`
  }
}

Inventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'requests', key: 'id' }
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'items', key: 'id' }
    },
    item_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'vendors', key: 'id' }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'locations', key: 'id' }
    },
    purchased_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    purchased_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    invoice: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    inventory_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    }
  },
  {
    sequelize,
    modelName: 'Inventory',
    tableName: 'inventory'
  }
)

module.exports = Inventory
