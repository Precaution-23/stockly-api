'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const { isEqual } = require('lodash')
const sequelize = require('../../config/sequelize')

const basename = path.basename(__filename)
const db = {}

// Auto-load all model files
fs.readdirSync(__dirname)
  .filter((file) => {
    return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))
    db[model.name] = model
  })

// Setup associations and audit log relationships
Object.keys(db).forEach((modelName) => {
  if (db[modelName].audit && db[modelName].audit['enabled']) {
    db[modelName].hasMany(db['AuditLog'], {
      constraints: false,
      foreignKey: 'model_id',
      scope: { model: modelName }
    })
    db['AuditLog'].belongsTo(db[modelName], {
      constraints: false,
      as: modelName,
      foreignKey: 'model_id'
    })
  }

  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

// --- Audit helpers ---

const getDiff = (changedKeys, oldValue, newValue, hookName) => {
  if (hookName === 'afterDestroy' || hookName === 'afterBulkDestroy') {
    return Object.fromEntries(
      Object.entries(newValue).map(([key, value]) => [key, [value, null]])
    )
  }

  if (hookName === 'afterBulkCreate') {
    return Object.fromEntries(
      Object.entries(newValue).map(([key, value]) => [key, [null, value]])
    )
  }

  const diffObj = {}
  changedKeys.forEach((key) => {
    if (!isEqual(oldValue[key], newValue[key])) {
      diffObj[key] = [oldValue[key], newValue[key]]
    }
  })
  return diffObj
}

const saveLogs = async (actionType, instance, options, hookName) => {
  try {
    const modelName = instance.constructor.name
    const isAuditModel = db[modelName] && db[modelName].audit && db[modelName].audit['enabled']

    if (!isAuditModel) return
    if (options.logAudit === false) return

    const diff = getDiff(
      instance._changed ? Object.keys(instance._changed) : Object.keys(instance.dataValues),
      instance._previousDataValues || {},
      instance.dataValues,
      hookName
    )

    await db['AuditLog'].create(
      {
        diff: JSON.stringify(diff),
        user_id: options.user_id || null,
        action_type: actionType,
        model: modelName,
        model_id: instance.id
      },
      { logAudit: false }
    )
  } catch (error) {
    console.error('Audit hook error:', error.message)
  }
}

// --- Global Sequelize hooks ---

sequelize.addHook('afterCreate', async (instance, options) => {
  await saveLogs('create', instance, options, 'afterCreate')
})

sequelize.addHook('afterUpdate', async (instance, options) => {
  await saveLogs('update', instance, options, 'afterUpdate')
})

sequelize.addHook('afterDestroy', async (instance, options) => {
  await saveLogs('delete', instance, options, 'afterDestroy')
})

sequelize.addHook('afterBulkCreate', async (instances, options) => {
  for (const inst of instances) {
    await saveLogs('create', inst, options, 'afterBulkCreate')
  }
})

sequelize.addHook('afterBulkUpdate', async (options) => {
  try {
    const modelName = options.model.name
    const isAuditModel = options.model.audit && options.model.audit['enabled']
    if (!isAuditModel || options.logAudit === false) return

    const instances = await options.model.findAll({
      where: options.where,
      transaction: options.transaction
    })

    for (const instance of instances) {
      const diff = getDiff(
        Object.keys(instance.dataValues),
        instance.dataValues,
        { ...instance.dataValues, ...options.attributes },
        'afterBulkUpdate'
      )
      await db['AuditLog'].create(
        {
          diff: JSON.stringify(diff),
          user_id: options.user_id || null,
          action_type: 'update',
          model: modelName,
          model_id: instance.id
        },
        { logAudit: false }
      )
    }
  } catch (error) {
    console.error('Audit bulk update hook error:', error.message)
  }
})

sequelize.addHook('beforeBulkDestroy', async (options) => {
  try {
    const isAuditModel = options.model.audit && options.model.audit['enabled']
    if (!isAuditModel) return
    options._instances = await options.model.findAll({ where: options.where })
  } catch (error) {
    console.error('Audit before bulk destroy hook error:', error.message)
  }
})

sequelize.addHook('afterBulkDestroy', async (options) => {
  try {
    const modelName = options.model.name
    const isAuditModel = options.model.audit && options.model.audit['enabled']
    if (!isAuditModel || options.logAudit === false) return

    const instances = options._instances || []
    for (const instance of instances) {
      const diff = getDiff(
        Object.keys(instance.dataValues),
        instance.dataValues,
        instance.dataValues,
        'afterBulkDestroy'
      )
      await db['AuditLog'].create(
        {
          diff: JSON.stringify(diff),
          user_id: options.user_id || null,
          action_type: 'delete',
          model: modelName,
          model_id: instance.id
        },
        { logAudit: false }
      )
    }
  } catch (error) {
    console.error('Audit bulk destroy hook error:', error.message)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
