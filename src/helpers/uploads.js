const path = require('path')

// Directory on disk where uploaded files are stored
const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOADS_PATH || 'uploads')

const ALLOWED_TYPES = {
  '.pdf': ['application/pdf'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.webp': ['image/webp']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

// References stored on records must point at a file produced by POST /uploads
const UPLOAD_PATH_RE = /^uploads\/[0-9a-f-]{36}\.(pdf|png|jpe?g|webp)$/

function assertUploadPath(p) {
  if (typeof p !== 'string' || !UPLOAD_PATH_RE.test(p)) throw new Error('Invalid file reference')
  return p
}

module.exports = { UPLOADS_DIR, ALLOWED_TYPES, MAX_FILE_SIZE, assertUploadPath }
