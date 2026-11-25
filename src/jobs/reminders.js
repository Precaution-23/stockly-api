// Daily reminder emails, sent every morning at REMINDER_HOUR_UTC (default 08:00 UTC = 08:00 in Ghana).
// - Final approval: every request still awaiting final approval (waiting at least 12 hours) is in that
//   day's email to the Final Approvers and the rule's named approver.
// - Earlier stages (pending, forwarded): reminded once every 3 days after waiting 3+ days.
// A request's updatedAt changes whenever its status moves, so it marks when the current stage began;
// last_reminded_at is saved with `silent` so it doesn't reset that clock. Reminders are tracked per
// calendar day, so a restart or a catch-up run never sends the same reminder twice in a day.
const { Op } = require('sequelize')
const db = require('../../database/models')
const mailer = require('../helpers/mailer')

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const FINAL_MIN_WAIT = 12 * HOUR
const OTHER_STALE_DAYS = 3
const REMINDER_HOUR_UTC = Number.isInteger(Number(process.env.REMINDER_HOUR_UTC)) ? Number(process.env.REMINDER_HOUR_UTC) % 24 : 8

const activeUsers = (group) => db.User.findAll({ where: { group_name: group, is_active: true } })

// Reviewers for a stage; admins step in when the group has nobody
async function reviewersFor(group) {
  const users = await activeUsers(group)
  return users.length ? users : activeUsers('admin')
}

const startOfDayUtc = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

async function runReminders(now = new Date()) {
  const today = startOfDayUtc(now)
  const notRemindedSince = (since) => ({ [Op.or]: [{ last_reminded_at: null }, { last_reminded_at: { [Op.lt]: since } }] })

  const [finalStage, earlierStages] = await Promise.all([
    db.Request.findAll({
      where: {
        [Op.and]: [
          { status: 'awaiting_final_approval', updatedAt: { [Op.lte]: new Date(now - FINAL_MIN_WAIT) } },
          notRemindedSince(today)
        ]
      },
      order: [['updatedAt', 'ASC']]
    }),
    db.Request.findAll({
      where: {
        [Op.and]: [
          { status: { [Op.in]: ['pending', 'forwarded'] }, updatedAt: { [Op.lt]: new Date(now - OTHER_STALE_DAYS * DAY) } },
          notRemindedSince(new Date(today - (OTHER_STALE_DAYS - 1) * DAY))
        ]
      },
      order: [['updatedAt', 'ASC']]
    })
  ])
  const requests = [...finalStage, ...earlierStages]
  if (!requests.length) return 0

  const byUser = new Map() // user id -> { user, items }
  const add = (user, request, tab) => {
    // Nobody is reminded about their own request (they can't act on it unless admin)
    if (String(user.id) === String(request.created_by) && user.group_name !== 'admin') return
    if (!byUser.has(user.id)) byUser.set(user.id, { user, items: [] })
    const entry = byUser.get(user.id)
    if (entry.items.some((i) => i.request.id === request.id)) return
    entry.items.push({ request, tab, days: Math.floor((now - new Date(request.updatedAt)) / DAY) })
  }

  const operation = await reviewersFor('operation')
  const finance = await reviewersFor('finance')
  const finalApprovers = await activeUsers('approver')
  for (const request of requests) {
    if (request.status === 'pending') operation.forEach((u) => add(u, request, 'manage'))
    if (request.status === 'forwarded') finance.forEach((u) => add(u, request, 'manage'))
    if (request.status === 'awaiting_final_approval') {
      // All Final Approvers plus the rule's named approver; admins only if nobody else can act
      const assigned = request.final_approver_id && (await db.User.findByPk(request.final_approver_id))
      const targets = [...finalApprovers]
      if (assigned && assigned.is_active && !targets.some((u) => u.id === assigned.id)) targets.push(assigned)
      if (!targets.length) targets.push(...(await activeUsers('admin')))
      targets.forEach((u) => add(u, request, u.group_name === 'admin' ? 'manage' : 'awaiting'))
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

// Milliseconds until the next REMINDER_HOUR_UTC:00
function msUntilNextRun(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), REMINDER_HOUR_UTC))
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next - now
}

function startReminderJob() {
  const run = () =>
    runReminders()
      .then((n) => n && console.log(`Reminder job: emailed ${n} user(s)`))
      .catch((err) => console.error('Reminder job error:', err.message))
  const scheduleNext = () => setTimeout(() => { run(); scheduleNext() }, msUntilNextRun()).unref()

  // If the server (re)starts after today's reminder time, catch up; per-day tracking prevents duplicates
  if (new Date().getUTCHours() >= REMINDER_HOUR_UTC) setTimeout(run, 60 * 1000).unref()
  scheduleNext()
}

module.exports = { runReminders, startReminderJob, msUntilNextRun }
