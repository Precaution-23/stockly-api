// Daily digest to reviewers about requests stuck at their stage for too long.
// A request's updatedAt changes whenever its status moves, so it marks when the current stage began;
// the reminder itself is saved with `silent` so it doesn't reset that clock.
const { Op } = require('sequelize')
const db = require('../../database/models')
const mailer = require('../helpers/mailer')

const STALE_DAYS = 3
const DAY = 24 * 60 * 60 * 1000

const activeUsers = (group) => db.User.findAll({ where: { group_name: group, is_active: true } })

// Reviewers for a stage; admins step in when the group has nobody
async function reviewersFor(group) {
  const users = await activeUsers(group)
  return users.length ? users : activeUsers('admin')
}

async function runReminders(now = new Date()) {
  const staleBefore = new Date(now.getTime() - STALE_DAYS * DAY)
  const requests = await db.Request.findAll({
    where: {
      status: { [Op.in]: ['pending', 'forwarded', 'awaiting_final_approval'] },
      updatedAt: { [Op.lt]: staleBefore },
      [Op.or]: [{ last_reminded_at: null }, { last_reminded_at: { [Op.lt]: staleBefore } }]
    },
    order: [['updatedAt', 'ASC']]
  })
  if (!requests.length) return 0

  const byUser = new Map() // user id -> { user, items }
  const add = (user, request, tab) => {
    // Nobody is reminded about their own request (they can't act on it unless admin)
    if (String(user.id) === String(request.created_by) && user.group_name !== 'admin') return
    if (!byUser.has(user.id)) byUser.set(user.id, { user, items: [] })
    const days = Math.floor((now - new Date(request.updatedAt)) / DAY)
    byUser.get(user.id).items.push({ request, tab, days })
  }

  const operation = await reviewersFor('operation')
  const finance = await reviewersFor('finance')
  const finalApprovers = await activeUsers('approver')
  for (const request of requests) {
    if (request.status === 'pending') operation.forEach((u) => add(u, request, 'manage'))
    if (request.status === 'forwarded') finance.forEach((u) => add(u, request, 'manage'))
    if (request.status === 'awaiting_final_approval') {
      // The assigned approver and all Final Approvers; admins only if nobody else can act
      const assigned = request.final_approver_id && (await db.User.findByPk(request.final_approver_id))
      const targets = [...finalApprovers]
      if (assigned && assigned.is_active && !targets.some((u) => u.id === assigned.id)) targets.push(assigned)
      if (targets.length) targets.forEach((u) => add(u, request, u.group_name === 'admin' ? 'manage' : 'awaiting'))
      else (await activeUsers('admin')).forEach((u) => add(u, request, 'manage'))
    }
  }

  for (const { user, items } of byUser.values()) {
    await mailer.sendPendingDigestEmail(user, items)
  }
  await db.Request.update(
    { last_reminded_at: now },
    { where: { id: requests.map((r) => r.id) }, silent: true, logAudit: false, hooks: false }
  )
  return byUser.size
}

function startReminderJob() {
  const run = () => runReminders().catch((err) => console.error('Reminder job error:', err.message))
  setTimeout(run, 60 * 1000).unref()
  setInterval(run, DAY).unref()
}

module.exports = { runReminders, startReminderJob }
