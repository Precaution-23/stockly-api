const nodemailer = require('nodemailer')

const devTransport = nodemailer.createTransport({
  host: 'localhost',
  port: 1025
})

const prodTransport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

const transporter = ['development', 'staging'].includes(process.env.NODE_ENV)
  ? devTransport
  : prodTransport

const FROM = process.env.MAIL_FROM || 'noreply@stockly.church'

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({ from: `Stockly <${FROM}>`, to, subject, html })
  } catch (err) {
    console.error('Mail error:', err.message)
  }
}

// Every user-supplied value goes through esc() so names/notes can't inject HTML or links into emails
const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Deep link that opens the request's details on the given requests tab (manage | mine | awaiting)
const requestUrl = (tab, request) => `${process.env.FRONTEND_URL}/requests/${tab}?id=${encodeURIComponent(request.id)}`
const linkHtml = (label, url) => `<p>${label}: <a href="${esc(url)}">${esc(url)}</a></p>`

const money = (n) => `GHS ${Number(n).toFixed(2)}`

function requestRowHtml(request) {
  return `
    <p><strong>Item:</strong> ${esc(request.item_name)}</p>
    <p><strong>Quantity:</strong> ${esc(request.quantity)}</p>
    <p><strong>Unit Price:</strong> ${money(request.unit_price)}</p>
    <p><strong>Total:</strong> ${money(Number(request.unit_price) * request.quantity)}</p>
    <p><strong>Needed By:</strong> ${esc(new Date(request.needed_by_date).toDateString())}</p>
  `
}

const personName = (u) => (u ? esc(`${u.first_name} ${u.last_name}`) : '—')

// To reviewers (Operation, or admins when there are none)
async function sendRequestCreatedEmail(reviewers, request, creator) {
  const html = `
    <h2>New Purchase Request Submitted</h2>
    <p><strong>Requested By:</strong> ${personName(creator)}${creator ? ` (${esc(creator.email)})` : ''}</p>
    ${requestRowHtml(request)}
    ${request.description ? `<p><strong>Description:</strong> ${esc(request.description)}</p>` : ''}
    ${linkHtml('Please review this request', requestUrl('manage', request))}
  `
  for (const user of reviewers) {
    await sendEmail(user.email, 'New Purchase Request', html)
  }
}

// Confirmation to the person who made the request
async function sendRequestSubmittedEmail(creator, request) {
  const html = `
    <h2>Your Purchase Request Was Submitted</h2>
    <p>Hi ${esc(creator.first_name)}, your request has been sent for review. You'll get an email at each step.</p>
    ${requestRowHtml(request)}
    ${linkHtml('Track it here', requestUrl('mine', request))}
  `
  await sendEmail(creator.email, 'Purchase Request Submitted', html)
}

async function sendRequestForwardedEmail(financeUsers, request) {
  const html = `
    <h2>Purchase Request Forwarded for Approval</h2>
    ${requestRowHtml(request)}
    <p>This request has been reviewed by the operations team and is awaiting your approval.</p>
    ${linkHtml('Review it here', requestUrl('manage', request))}
  `
  for (const user of financeUsers) {
    await sendEmail(user.email, 'Purchase Request Awaiting Your Approval', html)
  }
}

async function sendRequestFinalApprovalEmail(approver, request) {
  const html = `
    <h2>Purchase Request Awaiting Your Final Approval</h2>
    ${requestRowHtml(request)}
    <p>This request has been approved by finance and, based on its amount, requires your final approval.</p>
    ${linkHtml('Review it here', requestUrl('awaiting', request))}
  `
  await sendEmail(approver.email, 'Purchase Request Awaiting Your Final Approval', html)
}

async function sendRequestApprovedEmail(user, request) {
  const html = `
    <h2>Your Purchase Request Has Been Approved</h2>
    ${requestRowHtml(request)}
    <p>Your request has been approved and will be purchased soon.</p>
    ${linkHtml('View it here', requestUrl('mine', request))}
  `
  await sendEmail(user.email, 'Purchase Request Approved', html)
}

// To Operation when a request is fully approved and can be bought
async function sendReadyToPurchaseEmail(users, request) {
  const html = `
    <h2>Purchase Request Approved — Ready to Buy</h2>
    ${requestRowHtml(request)}
    <p>This request has received all its approvals and can now be purchased. Mark it as purchased (with the invoice) once it's bought.</p>
    ${linkHtml('Open it here', requestUrl('manage', request))}
  `
  for (const user of users) {
    await sendEmail(user.email, 'Request Approved — Ready to Purchase', html)
  }
}

async function sendRequestRejectedEmail(user, request, note) {
  const html = `
    <h2>Your Purchase Request Has Been Rejected</h2>
    ${requestRowHtml(request)}
    <p><strong>Reason:</strong> ${note ? esc(note) : 'No reason provided.'}</p>
    ${linkHtml('View it here', requestUrl('mine', request))}
  `
  await sendEmail(user.email, 'Purchase Request Rejected', html)
}

async function sendRequestPurchasedEmail(user, request) {
  const html = `
    <h2>Your Purchase Request Has Been Fulfilled</h2>
    ${requestRowHtml(request)}
    <p>The item has been purchased and added to inventory.</p>
    ${linkHtml('View it here', requestUrl('mine', request))}
  `
  await sendEmail(user.email, 'Purchase Request Fulfilled', html)
}

// Daily reminder listing requests that have waited too long at the reviewer's stage
async function sendPendingDigestEmail(user, items) {
  const rows = items
    .map(({ request, tab, days }) => `
      <tr>
        <td style="padding:4px 8px">${esc(request.item_name)} × ${esc(request.quantity)}</td>
        <td style="padding:4px 8px">${money(Number(request.unit_price) * request.quantity)}</td>
        <td style="padding:4px 8px">${days} days</td>
        <td style="padding:4px 8px"><a href="${esc(requestUrl(tab, request))}">Open</a></td>
      </tr>`)
    .join('')
  const html = `
    <h2>Requests Waiting for You</h2>
    <p>Hi ${esc(user.first_name)}, ${items.length === 1 ? 'this request has' : `these ${items.length} requests have`} been waiting for your action for a while:</p>
    <table style="border-collapse:collapse">
      <tr><th align="left" style="padding:4px 8px">Item</th><th align="left" style="padding:4px 8px">Total</th><th align="left" style="padding:4px 8px">Waiting</th><th></th></tr>
      ${rows}
    </table>
  `
  await sendEmail(user.email, `Reminder: ${items.length} request${items.length === 1 ? '' : 's'} waiting for you`, html)
}

function itemRowHtml(item) {
  return `
    <p><strong>Item:</strong> ${esc(item.name)}</p>
    <p><strong>Description:</strong> ${item.description ? esc(item.description) : '—'}</p>
  `
}

async function sendItemPendingApprovalEmail(managers, item, creator) {
  const itemsUrl = `${process.env.FRONTEND_URL}/configurations/items`
  const html = `
    <h2>New Item Awaiting Approval</h2>
    ${itemRowHtml(item)}
    <p><strong>Created By:</strong> ${creator ? `${personName(creator)} (${esc(creator.email)})` : '—'}</p>
    ${linkHtml('Please review and approve it here', itemsUrl)}
  `
  for (const user of managers) {
    await sendEmail(user.email, 'New Item Awaiting Approval', html)
  }
}

async function sendItemApprovedEmail(user, item) {
  const html = `
    <h2>Your Item Has Been Approved</h2>
    ${itemRowHtml(item)}
    <p>The item is now available for everyone to select when making requests.</p>
  `
  await sendEmail(user.email, 'Item Approved', html)
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`
  const html = `
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
    <a href="${esc(resetUrl)}">${esc(resetUrl)}</a>
    <p>If you did not request this, you can safely ignore this email.</p>
  `
  await sendEmail(email, 'Reset Your Password', html)
}

// Sent when an administrator creates an account: the user picks their own password via the link
async function sendWelcomeEmail(user, token) {
  const setUrl = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}&welcome=1`
  const html = `
    <h2>Welcome to Stockly, ${esc(user.first_name)}</h2>
    <p>An administrator has created a Stockly account for you.</p>
    <p><strong>Your login email:</strong> ${esc(user.email)}</p>
    <p>Click the link below to choose your password. This link expires in 3 days.</p>
    <a href="${esc(setUrl)}">${esc(setUrl)}</a>
    <p>If the link has expired, use "Forgot password" on the login page: ${esc(process.env.FRONTEND_URL)}/login</p>
  `
  await sendEmail(user.email, 'Your Stockly account', html)
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendRequestCreatedEmail,
  sendRequestSubmittedEmail,
  sendRequestForwardedEmail,
  sendRequestFinalApprovalEmail,
  sendRequestApprovedEmail,
  sendRequestRejectedEmail,
  sendRequestPurchasedEmail,
  sendItemPendingApprovalEmail,
  sendItemApprovedEmail,
  sendPasswordResetEmail,
  sendPendingDigestEmail,
  sendReadyToPurchaseEmail
}
