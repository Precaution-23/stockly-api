const fs = require('fs')
const path = require('path')
const express = require('express')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const Jwt = require('../helpers/jwt')
const { UPLOADS_DIR, ALLOWED_TYPES, MAX_FILE_SIZE } = require('../helpers/uploads')

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_TYPES[ext] && ALLOWED_TYPES[ext].includes(file.mimetype)) return cb(null, true)
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'))
  }
}).single('file')

const router = express.Router()

async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').split(' ')[1]
    req.user = await Jwt.verifyToken(token)
    next()
  } catch (error) {
    res.status(401).json({ message: error.message || 'Unauthorized' })
  }
}

router.post('/', requireAuth, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`
          : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Only PDF, PNG, JPG and WEBP files are allowed'
            : err.message
      return res.status(400).json({ message })
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded (field name must be "file")' })
    res.status(201).json({ path: `uploads/${req.file.filename}` })
  })
})

module.exports = router
