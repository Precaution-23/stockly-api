const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString, GraphQLBoolean } = require('graphql')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { Op, where, fn, col } = require('sequelize')
const UserType = require('../types/userType')
const db = require('../../../database/models')
const Jwt = require('../../helpers/jwt')
const { sendWelcomeEmail } = require('../../helpers/mailer')
const { assertPermission } = require('../../helpers/requestAuth')

const GROUPS = ['admin', 'operation', 'finance', 'requester']
const MIN_PASSWORD = 8

const createUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: () => ({
    id: { type: GraphQLID },
    first_name: { type: new GraphQLNonNull(GraphQLString) },
    last_name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: GraphQLString },
    group_name: { type: new GraphQLNonNull(GraphQLString) },
    role_id: { type: GraphQLID },
    is_active: { type: GraphQLBoolean }
  })
})

module.exports = {
  type: UserType,
  args: { payload: { type: new GraphQLNonNull(createUserInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user: currentUser } = await context()
      const isUpdate = !!payload.id
      assertPermission(currentUser, 'Users', isUpdate ? 'update' : 'create')

      const email = payload.email.trim().toLowerCase()
      if (!email) throw new Error('Email is required')
      if (!GROUPS.includes(payload.group_name)) throw new Error('Invalid group')
      const password = payload.password || ''
      if (password && password.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters`)

      const duplicate = await db.User.findOne({
        where: {
          [Op.and]: [
            where(fn('lower', col('email')), email),
            ...(isUpdate ? [{ id: { [Op.ne]: payload.id } }] : [])
          ]
        },
        paranoid: false
      })
      if (duplicate) throw new Error('A user with this email already exists')

      const data = {
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        email,
        group_name: payload.group_name,
        role_id: payload.role_id || null
      }
      if (payload.is_active !== undefined && payload.is_active !== null) data.is_active = payload.is_active

      if (isUpdate) {
        const user = await db.User.findByPk(payload.id)
        if (!user) throw new Error('User not found')
        if (String(user.id) === String(currentUser.id) && data.is_active === false) {
          throw new Error('You cannot deactivate your own account')
        }
        // A new password is only set when one is typed; blank keeps the current one
        if (password) data.password = await bcrypt.hash(password, 10)
        return user.update(data, { user_id: currentUser.id })
      }

      // No default password: without one, the account gets an unguessable random password
      // and the welcome email lets the user choose their own
      const hashedPassword = await bcrypt.hash(password || crypto.randomBytes(32).toString('hex'), 10)
      const user = await db.User.create({ ...data, password: hashedPassword }, { user_id: currentUser.id })

      sendWelcomeEmail(user, Jwt.generateResetToken(user, '3d')).catch(console.error)
      return user
    } catch (error) {
      return error
    }
  }
}
