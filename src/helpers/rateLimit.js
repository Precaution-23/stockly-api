// Small in-memory fixed-window rate limiter (single API instance on Render, so memory is enough).
const buckets = new Map()

function bucket(key, windowMs) {
  const now = Date.now()
  let b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs }
    buckets.set(key, b)
  }
  return b
}

function tooMany(b) {
  const minutes = Math.max(1, Math.ceil((b.resetAt - Date.now()) / 60000))
  return new Error(`Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`)
}

// Throws if `key` is already at `max` within the window (does not count this call)
function check(key, max, windowMs) {
  const b = bucket(key, windowMs)
  if (b.count >= max) throw tooMany(b)
}

// Counts one attempt; throws once the limit is exceeded
function hit(key, max, windowMs) {
  const b = bucket(key, windowMs)
  if (b.count >= max) throw tooMany(b)
  b.count += 1
}

function reset(key) {
  buckets.delete(key)
}

// Drop expired buckets now and then so memory doesn't grow
setInterval(() => {
  const now = Date.now()
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key)
}, 10 * 60 * 1000).unref()

module.exports = { check, hit, reset }
