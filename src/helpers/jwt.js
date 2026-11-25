const jwt = require('jsonwebtoken')
const db = require('../../database/models')

class Jwt {
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email
    }
    const options = {
      expiresIn: process.env.NODE_ENV === 'development' ? '53 weeks' : '1h'
    }
    return jwt.sign(payload, process.env.JWT_SECRET, options)
  }

  static getTokenPayload(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  static async verifyToken(token) {
    if (!token) throw new Error('No token provided')
    const decoded = this.getTokenPayload(token)
    const blacklisted = await db.TokenBlacklist.findOne({ where: { token } })
    if (blacklisted) throw new Error('Token has been invalidated')
    const user = await db.User.findByPk(decoded.id, {
      include: [
        {
          model: db.Role,
          include: [{ model: db.Permission }]
        }
      ]
    })
    if (!user || !user.is_active) throw new Error('User not found or inactive')
    return user
  }

  static async blacklistToken(token) {
    const decoded = jwt.decode(token)
    await db.TokenBlacklist.create({
      token,
      expires_at: new Date(decoded.exp * 1000)
    })
  }

  // Signed with the current password hash, so the link stops working once the password changes
  static generateResetToken(user, expiresIn = '15m') {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET + user.password,
      { expiresIn }
    )
  }

  static async verifyResetToken(token) {
    const decoded = jwt.decode(token)
    if (!decoded?.id) throw new Error('Invalid reset token')
    const user = await db.User.findByPk(decoded.id)
    if (!user) throw new Error('User not found')
    try {
      jwt.verify(token, process.env.JWT_SECRET + user.password)
    } catch {
      throw new Error('Reset token is invalid or has expired')
    }
    return user
  }
}

module.exports = Jwt
