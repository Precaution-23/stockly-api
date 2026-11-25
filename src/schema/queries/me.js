const UserType = require('../types/userType')
const db = require('../../../database/models')

module.exports = {
  type: UserType,
  async resolve(_, __, context) {
    try {
      const { user } = await context()
      return db.User.findByPk(user.id, {
        include: [{ model: db.Role, include: [{ model: db.Permission }] }]
      })
    } catch (error) {
      return error
    }
  }
}
