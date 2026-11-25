const { GraphQLNonNull, GraphQLID, GraphQLBoolean } = require('graphql')
const db = require('../../../database/models')
const { canManageConfigurations } = require('../../helpers/requestAuth')

module.exports = {
  type: GraphQLBoolean,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      if (!canManageConfigurations(user)) throw new Error('Not authorized')

      const rule = await db.ApprovalRule.findByPk(id)
      if (!rule) throw new Error('Approval rule not found')

      await rule.destroy({ user_id: user.id })
      return true
    } catch (error) {
      return error
    }
  }
}
