const { GraphQLList } = require('graphql')
const ApprovalRuleType = require('../types/approvalRuleType')
const db = require('../../../database/models')

module.exports = {
  type: new GraphQLList(ApprovalRuleType),
  async resolve(_, __, context) {
    try {
      await context()
      return db.ApprovalRule.findAll({ order: [['min_amount', 'ASC']] })
    } catch (error) {
      return error
    }
  }
}
