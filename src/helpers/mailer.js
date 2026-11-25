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

function requestRowHtml(request) {
  return `
    <p><strong>Item:</strong> ${request.item_name}</p>
    <p><strong>Quantity:</strong> ${request.quantity}</p>
    <p><strong>Unit Price:</strong> GHS ${Number(request.unit_price).toFixed(2)}</p>
    <p><strong>Total:</strong> GHS ${(Number(request.unit_price) * request.quantity).toFixed(2)}</p>
    <p><strong>Needed By:</strong> ${new Date(request.needed_by_date).toDateString()}</p>
  `
}

const personName = (u) => (u ? `${u.first_name} ${u.last_name}` : '—')

// To reviewers (Operation, or admins when there are none)
async function sendRequestCreatedEmail(reviewers, request, creator) {
  const url = `${process.env.FRONTEND_URL}/requests/manage`
  const html = `
    <h2>New Purchase Request Submitted</h2>
    <p><strong>Requested By:</strong> ${personName(creator)}${creator ? ` (${creator.email})` : ''}</p>
    ${requestRowHtml(request)}
    ${request.description ? `<p><strong>Description:</strong> ${request.description}</p>` : ''}
    <p>Please review this request: <a href="${url}">${url}</a></p>
  `
  for (const user of reviewers) {
    await sendEmail(user.email, 'New Purchase Request', html)
  }
}

// Confirmation to the person who made the request
async function sendRequestSubmittedEmail(creator, request) {
  const url = `${process.env.FRONTEND_URL}/requests/mine`
  const html = `
    <h2>Your Purchase Request Was Submitted</h2>
    <p>Hi ${creator.first_name}, your request has been sent for review. You'll get an email at each step.</p>
    ${requestRowHtml(request)}
    <p>Track it here: <a href="${url}">${url}</a></p>
  `
  await sendEmail(creator.email, 'Purchase Request Submitted', html)
}

async function sendRequestForwardedEmail(financeUsers, request) {
  const html = `
    <h2>Purchase Request Forwarded for Approval</h2>
    ${requestRowHtml(request)}
    <p>This request has been reviewed by the operations team and is awaiting your approval.</p>
  `
  for (const user of financeUsers) {
    await sendEmail(user.email, 'Purchase Request Awaiting Your Approval', html)
  }
}

async function sendRequestFinalApprovalEmail(approver, request) {
  const url = `${process.env.FRONTEND_URL}/requests/awaiting`
  const html = `
    <h2>Purchase Request Awaiting Your Final Approval</h2>
    ${requestRowHtml(request)}
    <p>This request has been approved by finance and, based on its amount, requires your final approval.</p>
    <p>Review it here: <a href="${url}">${url}</a></p>
  `
  await sendEmail(approver.email, 'Purchase Request Awaiting Your Final Approval', html)
}

async function sendRequestApprovedEmail(user, request) {
  const html = `
    <h2>Your Purchase Request Has Been Approved</h2>
    ${requestRowHtml(request)}
    <p>Your request has been approved and will be purchased soon.</p>
  `
  await sendEmail(user.email, 'Purchase Request Approved', html)
}

async function sendRequestRejectedEmail(user, request, note) {
  const html = `
    <h2>Your Purchase Request Has Been Rejected</h2>
    ${requestRowHtml(request)}
    <p><strong>Reason:</strong> ${note || 'No reason provided.'}</p>
  `
  await sendEmail(user.email, 'Purchase Request Rejected', html)
}

async function sendRequestPurchasedEmail(user, request) {
  const html = `
    <h2>Your Purchase Request Has Been Fulfilled</h2>
    ${requestRowHtml(request)}
    <p>The item has been purchased and added to inventory.</p>
  `
  await sendEmail(user.email, 'Purchase Request Fulfilled', html)
}

function itemRowHtml(item) {
  return `
    <p><strong>Item:</strong> ${item.name}</p>
    <p><strong>Description:</strong> ${item.description || '—'}</p>
  `
}

async function sendItemPendingApprovalEmail(managers, item, creator) {
  const itemsUrl = `${process.env.FRONTEND_URL}/configurations/items`
  const html = `
    <h2>New Item Awaiting Approval</h2>
    ${itemRowHtml(item)}
    <p><strong>Created By:</strong> ${creator ? `${creator.first_name} ${creator.last_name} (${creator.email})` : '—'}</p>
    <p>Please review and approve it here: <a href="${itemsUrl}">${itemsUrl}</a></p>
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
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
  const html = `
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>If you did not request this, you can safely ignore this email.</p>
  `
  await sendEmail(email, 'Reset Your Password', html)
}

// Sent when an administrator creates an account: the user picks their own password via the link
async function sendWelcomeEmail(user, token) {
  const setUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&welcome=1`
  const html = `
    <h2>Welcome to Stockly, ${user.first_name}</h2>
    <p>An administrator has created a Stockly account for you.</p>
    <p><strong>Your login email:</strong> ${user.email}</p>
    <p>Click the link below to choose your password. This link expires in 3 days.</p>
    <a href="${setUrl}">${setUrl}</a>
    <p>If the link has expired, use "Forgot password" on the login page: ${process.env.FRONTEND_URL}/login</p>
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
  sendPasswordResetEmail
}
