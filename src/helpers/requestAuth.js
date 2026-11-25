const { Op } = require('sequelize')
const db = require('../../database/models')

function assertGroup(user, groups) {
  if (!groups.includes(user.group_name)) throw new Error('Not authorized')
}

// `update` shadows Model#update on Permission instances, so read columns via get()
function hasPermission(user, resource, action) {
  const permissions = user?.Role?.Permissions || []
  return permissions.some((p) => p.get('resource') === resource && p.get(action) === true)
}

function canManageConfigurations(user) {
  return hasPermission(user, 'Configurations', 'update')
}

function requestTotal(request) {
  return Number(request.unit_price) * request.quantity
}

// Active rule whose range [min_amount, max_amount) contains the total; highest minimum wins
function findApprovalRule(total) {
  return db.ApprovalRule.findOne({
    where: {
      is_active: true,
      min_amount: { [Op.lte]: total },
      [Op.or]: [{ max_amount: null }, { max_amount: { [Op.gt]: total } }]
    },
    order: [['min_amount', 'DESC']]
  })
}

module.exports = { assertGroup, hasPermission, canManageConfigurations, requestTotal, findApprovalRule }
