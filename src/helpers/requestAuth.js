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

// Throws unless the user's role grants `action` on `resource` (checked on the server, not just hidden in the UI)
function assertPermission(user, resource, action) {
  if (!hasPermission(user, resource, action)) throw new Error('Not authorized')
}

// Separation of duties: nobody (except admins) may forward, approve, reject or purchase their own request
function assertNotOwnRequest(user, request) {
  if (user.group_name === 'admin') return
  if (request.created_by != null && String(request.created_by) === String(user.id)) {
    throw new Error("You can't act on your own request. Another reviewer must handle it.")
  }
}

// Who may see a single request: its creator, its final approver, or the workflow groups
// (finance never sees pending requests, matching the requests list)
function canViewRequest(user, request) {
  if (String(request.created_by) === String(user.id)) return true
  if (request.final_approver_id != null && String(request.final_approver_id) === String(user.id)) return true
  if (['admin', 'operation'].includes(user.group_name)) return true
  if (user.group_name === 'finance') return request.status !== 'pending'
  return false
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

module.exports = { assertGroup, hasPermission, assertPermission, assertNotOwnRequest, canViewRequest, canManageConfigurations, requestTotal, findApprovalRule }
