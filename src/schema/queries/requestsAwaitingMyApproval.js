const { GraphQLList } = require('graphql')
const RequestType = require('../types/requestType')
const db = require('../../../database/models')

module.exports = {
  type: new GraphQLList(RequestType),
  async resolve(_, __, context) {
    try {
      const { user } = await context()
      return db.Request.findAll({
        // Final Approvers see every request awaiting final approval; anyone else only the ones a rule assigned to them
        where: {
          status: 'awaiting_final_approval',
          ...(user.group_name === 'approver' ? {} : { final_approver_id: user.id })
        },
        order: [['createdAt', 'DESC']]
      })
    } catch (error) {
      return error
    }
  }
}
