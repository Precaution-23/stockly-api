'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class ApprovalRule extends Model {
  static associate(models) {
    ApprovalRule.belongsTo(models.User, { foreignKey: 'approver_id', as: 'approver' })
  }

  async auditDescription() {
    const max = this.max_amount === null ? 'no limit' : `GHS ${this.max_amount}`
    return `GHS ${this.min_amount} – ${max}`
  }
}

ApprovalRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    min_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    max_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    approver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ApprovalRule',
    tableName: 'approval_rules',
    paranoid: true,
    deletedAt: 'deleted_at'
  }
)

ApprovalRule.audit = { enabled: true, name: 'approval_rule' }

module.exports = ApprovalRule
