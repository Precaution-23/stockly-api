'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Vendor extends Model {
  static associate(models) {
    Vendor.hasMany(models.Request, { foreignKey: 'vendor_id' })
    Vendor.hasMany(models.Inventory, { foreignKey: 'vendor_id' })
  }

  async auditDescription() {
    return `${this.name}`
  }
}

Vendor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
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
    modelName: 'Vendor',
    tableName: 'vendors',
    paranoid: true,
    deletedAt: 'deleted_at'
  }
)

Vendor.audit = { enabled: true, name: 'vendor' }

module.exports = Vendor
