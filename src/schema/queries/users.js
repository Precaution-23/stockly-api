const { GraphQLList, GraphQLInputObjectType, GraphQLString } = require('graphql')
const { Op } = require('sequelize')
const UserType = require('../types/userType')
const db = require('../../../database/models')
const { hasPermission } = require('../../helpers/requestAuth')

const usersQueryInput = new GraphQLInputObjectType({
  name: 'UsersQueryInput',
  fields: () => ({
    q: { type: GraphQLString }
  })
})

module.exports = {
  type: new GraphQLList(UserType),
  args: {
    payload: { type: usersQueryInput }
  },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      // User list (emails, roles) is for user admins, plus config admins picking approvers
      if (!hasPermission(user, 'Users', 'read') && !hasPermission(user, 'Configurations', 'update')) throw new Error('Not authorized')
      const where = {}
      if (payload && payload.q) {
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${payload.q}%` } },
          { last_name: { [Op.iLike]: `%${payload.q}%` } },
          { email: { [Op.iLike]: `%${payload.q}%` } }
        ]
      }
      return db.User.findAll({
        where,
        include: [{ model: db.Role, include: [{ model: db.Permission }] }],
        order: [['createdAt', 'DESC']]
      })
    } catch (error) {
      return error
    }
  }
}
