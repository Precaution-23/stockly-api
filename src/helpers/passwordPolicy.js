// Password rules enforced wherever a password is set (keep in sync with stockly-web
// src/@core/utils/passwordPolicy.ts). Existing passwords are not affected until changed.
const MIN_LENGTH = 8
const MAX_LENGTH = 72 // bcrypt ignores anything past 72 bytes

const RULES = [
  { test: (p) => p.length >= MIN_LENGTH, message: `at least ${MIN_LENGTH} characters` },
  { test: (p) => p.length <= MAX_LENGTH, message: `no more than ${MAX_LENGTH} characters` },
  { test: (p) => /[A-Z]/.test(p), message: 'an uppercase letter' },
  { test: (p) => /[a-z]/.test(p), message: 'a lowercase letter' },
  { test: (p) => /[0-9]/.test(p), message: 'a number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), message: 'a special character (e.g. ! @ # $ %)' },
]

// Returns a list of unmet requirements (empty when the password is acceptable)
function passwordProblems(password, email) {
  const p = String(password || '')
  const missing = RULES.filter((r) => !r.test(p)).map((r) => r.message)
  const local = String(email || '').split('@')[0].toLowerCase()
  const containsEmail = local.length >= 3 && p.toLowerCase().includes(local)
  return { missing, containsEmail }
}

function assertStrongPassword(password, email) {
  const { missing, containsEmail } = passwordProblems(password, email)
  if (missing.length) throw new Error(`Password must have ${missing.join(', ')}`)
  if (containsEmail) throw new Error('Password must not contain your email name')
}

module.exports = { MIN_LENGTH, MAX_LENGTH, passwordProblems, assertStrongPassword }
