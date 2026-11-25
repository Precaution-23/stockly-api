'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class User extends Model {
  static associate(models) {
    User.belongsTo(models.Role, { foreignKey: 'role_id' })
    User.hasMany(models.Request, { foreignKey: 'created_by', as: 'createdRequests' })
    User.hasMany(models.Request, { foreignKey: 'reviewed_by', as: 'reviewedRequests' })
    User.hasMany(models.Request, { foreignKey: 'approved_by', as: 'approvedRequests' })
    User.hasMany(models.Request, { foreignKey: 'purchased_by', as: 'purchasedRequests' })
  }

  fullName() {
    return `${this.first_name} ${this.last_name}`
  }

  async auditDescription() {
    return `${this.fullName()}`
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    group_name: {
      type: DataTypes.ENUM('admin', 'operation', 'finance', 'requester', 'approver'),
      allowNull: false,
      defaultValue: 'requester'
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'roles', key: 'id' }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    paranoid: true,
    deletedAt: 'deleted_at'
  }
)

User.audit = { enabled: true, name: 'user' }

module.exports = User
