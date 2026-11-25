// Single entry point for user alerts. Every alert is delivered both in-app and by email,
// so new reminders/alerts should be added here rather than calling the mailer directly.
// (Password reset stays email-only in mailer.js: the recipient isn't signed in.)
const db = require('../../database/models')
const mailer = require('./mailer')

const ghs = (n) => `GHS ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const requestSummary = (r) => `${r.item_name.trim()} × ${r.quantity} (${ghs(Number(r.unit_price) * r.quantity)})`

async function createInApp(users, { type, title, message, link }) {
  const ids = [...new Set([].concat(users).filter(Boolean).map((u) => u.id))]
  if (!ids.length) return
  await db.Notification.bulkCreate(ids.map((user_id) => ({ user_id, type, title, message, link })))
}

// Deliver on both channels independently: a failure in one never drops the other
async function deliver(users, inApp, sendEmail) {
  try {
    await createInApp(users, inApp)
  } catch (err) {
    console.error('In-app notification error:', err.message)
  }
  try {
    await sendEmail()
  } catch (err) {
    console.error('Email notification error:', err.message)
  }
}

module.exports = {
  createInApp,

  requestCreated: (users, request, creator) => deliver(users, {
    type: 'request_created',
    title: 'New purchase request',
    message: `${requestSummary(request)} needs review`,
    link: `/requests/manage?id=${request.id}`
  }, () => mailer.sendRequestCreatedEmail(users, request, creator)),

  requestSubmitted: (creator, request) => deliver(creator, {
    type: 'request_submitted',
    title: 'Request submitted',
    message: `Your request for ${requestSummary(request)} was sent for review`,
    link: `/requests/mine?id=${request.id}`
  }, () => mailer.sendRequestSubmittedEmail(creator, request)),

  requestForwarded: (users, request) => deliver(users, {
    type: 'request_forwarded',
    title: 'Request awaiting finance approval',
    message: `${requestSummary(request)} was forwarded for approval`,
    link: `/requests/manage?id=${request.id}`
  }, () => mailer.sendRequestForwardedEmail(users, request)),

  requestFinalApproval: (approver, request) => deliver(approver, {
    type: 'request_final_approval',
    title: 'Final approval needed',
    message: `${requestSummary(request)} needs your final approval`,
    link: `/requests/awaiting?id=${request.id}`
  }, () => mailer.sendRequestFinalApprovalEmail(approver, request)),

  requestApproved: (user, request) => deliver(user, {
    type: 'request_approved',
    title: 'Request approved',
    message: `Your request for ${requestSummary(request)} was approved`,
    link: `/requests/mine?id=${request.id}`
  }, () => mailer.sendRequestApprovedEmail(user, request)),

  readyToPurchase: (users, request) => deliver(users, {
    type: 'request_ready_to_purchase',
    title: 'Ready to purchase',
    message: `${requestSummary(request)} is fully approved and can be bought`,
    link: `/requests/manage?id=${request.id}`
  }, () => mailer.sendReadyToPurchaseEmail(users, request)),

  requestRejected: (user, request, note) => deliver(user, {
    type: 'request_rejected',
    title: 'Request rejected',
    message: `Your request for ${requestSummary(request)} was rejected${note ? `: ${note}` : ''}`,
    link: `/requests/mine?id=${request.id}`
  }, () => mailer.sendRequestRejectedEmail(user, request, note)),

  requestPurchased: (user, request) => deliver(user, {
    type: 'request_purchased',
    title: 'Request purchased',
    message: `${requestSummary(request)} has been purchased and added to inventory`,
    link: `/requests/mine?id=${request.id}`
  }, () => mailer.sendRequestPurchasedEmail(user, request)),

  itemPendingApproval: (managers, item, creator) => deliver(managers, {
    type: 'item_pending_approval',
    title: 'New item awaiting approval',
    message: `"${item.name}" was added${creator ? ` by ${creator.first_name} ${creator.last_name}` : ''}`,
    link: '/configurations/items'
  }, () => mailer.sendItemPendingApprovalEmail(managers, item, creator)),

  itemApproved: (user, item) => deliver(user, {
    type: 'item_approved',
    title: 'Item approved',
    message: `"${item.name}" is now available to everyone`,
    link: '/requests/mine'
  }, () => mailer.sendItemApprovedEmail(user, item))
}
