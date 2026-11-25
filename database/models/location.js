'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Location extends Model {
  static associate(models) {
    Location.belongsTo(models.Location, { foreignKey: 'parent_id', as: 'parentLocation' })
    Location.hasMany(models.Location, { foreignKey: 'parent_id', as: 'children' })
    Location.hasMany(models.Request, { foreignKey: 'location_id' })
    Location.hasMany(models.Inventory, { foreignKey: 'location_id' })
  }

  async auditDescription() {
    return `${this.name}`
  }
}

Location.init(
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
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'locations', key: 'id' }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    paranoid: true,
    deletedAt: 'deleted_at'
  }
)

Location.audit = { enabled: true, name: 'location' }

module.exports = Location
