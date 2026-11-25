'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../../config/sequelize')

class Request extends Model {
  static associate(models) {
    Request.belongsTo(models.Item, { foreignKey: 'item_id', as: 'item' })
    Request.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' })
    Request.belongsTo(models.Location, { foreignKey: 'location_id', as: 'location' })
    Request.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' })
    Request.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' })
    Request.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' })
    Request.belongsTo(models.User, { foreignKey: 'purchased_by', as: 'purchaser' })
    Request.belongsTo(models.User, { foreignKey: 'final_approver_id', as: 'finalApprover' })
    Request.belongsTo(models.User, { foreignKey: 'final_approved_by', as: 'finalApprovedBy' })
  }

  async auditDescription() {
    return `Request for ${this.item_name}`
  }
}

Request.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
    needed_by_date: {
      type: DataTypes.DATE,
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    invoice_1: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    invoice_2: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    invoice_3: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    purchase_invoice: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'forwarded', 'awaiting_final_approval', 'approved', 'rejected', 'purchased'),
      allowNull: false,
      defaultValue: 'pending'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    purchased_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    purchased_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    final_approver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    final_approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    final_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    rejection_note: {
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
    modelName: 'Request',
    tableName: 'requests',
    paranoid: true,
    deletedAt: 'deleted_at'
  }
)

Request.audit = { enabled: true, name: 'request' }

module.exports = Request
