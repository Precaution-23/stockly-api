const { GraphQLList } = require('graphql')
const RoleType = require('../types/roleType')
const db = require('../../../database/models')

module.exports = {
  type: new GraphQLList(RoleType),
  async resolve(_, __, context) {
    try {
      await context()
      return db.Role.findAll({
        include: [{ model: db.Permission }],
        order: [['createdAt', 'ASC']]
      })
    } catch (error) {
      return error
    }
  }
}
