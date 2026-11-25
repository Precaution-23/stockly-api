const { GraphQLList } = require('graphql')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')

module.exports = {
  type: new GraphQLList(RequestType),
  async resolve(_, __, context) {
    try {
      const { user } = await context()
      return db.Request.findAll({
        where: { created_by: user.id },
        order: [['createdAt', 'DESC']]
      })
    } catch (error) {
      return error
    }
  }
}
