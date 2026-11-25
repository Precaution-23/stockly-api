const db = require('../../database/models')
const { hasPermission } = require('./requestAuth')

// Users who can manage items: active users whose role has Items update permission
function getItemManagers() {
  return db.User.findAll({
    where: { is_active: true },
    include: [
      {
        model: db.Role,
        required: true,
        include: [{ model: db.Permission, required: true, where: { resource: 'Items', update: true } }]
      }
    ]
  })
}

function canManageItems(user) {
  return hasPermission(user, 'Items', 'update')
}

module.exports = { getItemManagers, canManageItems }
