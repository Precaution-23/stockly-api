'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Department extends Model {
  static associate(models) {
    Department.hasMany(models.Item, { foreignKey: 'department_id' })
  }

  async auditDescription() {
    return `${this.name}`
  }
}

Department.init(
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
    tag: {
      type: DataTypes.STRING,
      allowNull: true
    },
    inventory_prefix: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    paranoid: true,
    deletedAt: 'deleted_at'
  }
)

Department.audit = { enabled: true, name: 'department' }

module.exports = Department
