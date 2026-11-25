const { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLFloat, GraphQLBoolean } = require('graphql')
const DateType = require('./dateType')
const db = require('../../../database/models')

const ApprovalRuleType = new GraphQLObjectType({
  name: 'ApprovalRule',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    min_amount: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: (parent) => Number(parent.min_amount)
    },
    max_amount: {
      type: GraphQLFloat,
      resolve: (parent) => (parent.max_amount === null ? null : Number(parent.max_amount))
    },
    approver_id: { type: new GraphQLNonNull(GraphQLID) },
    approver: {
      type: require('./userType'),
      async resolve(parent) {
        return db.User.findByPk(parent.approver_id)
      }
    },
    is_active: { type: GraphQLBoolean },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = ApprovalRuleType
