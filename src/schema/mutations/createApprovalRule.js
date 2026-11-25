const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLFloat, GraphQLBoolean } = require('graphql')
const { Op } = require('sequelize')
const ApprovalRuleType = require('../types/approvalRuleType')
const db = require('../../../database/models')
const { canManageConfigurations } = require('../../helpers/requestAuth')

const createApprovalRuleInput = new GraphQLInputObjectType({
  name: 'CreateApprovalRuleInput',
  fields: () => ({
    id: { type: GraphQLID },
    min_amount: { type: new GraphQLNonNull(GraphQLFloat) },
    max_amount: { type: GraphQLFloat },
    approver_id: { type: new GraphQLNonNull(GraphQLID) },
    is_active: { type: GraphQLBoolean }
  })
})

const fmt = (n) => (n === null ? 'no limit' : `GHS ${Number(n).toFixed(2)}`)

module.exports = {
  type: ApprovalRuleType,
  args: { payload: { type: new GraphQLNonNull(createApprovalRuleInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      if (!canManageConfigurations(user)) throw new Error('Not authorized')

      const { id, min_amount, approver_id } = payload
      const max_amount = payload.max_amount ?? null
      const is_active = payload.is_active ?? true

      if (min_amount < 0) throw new Error('Minimum amount cannot be negative')
      if (max_amount !== null && max_amount <= min_amount) {
        throw new Error('Maximum amount must be greater than the minimum amount')
      }

      const approver = await db.User.findByPk(approver_id)
      if (!approver || !approver.is_active) throw new Error('Approver not found or inactive')

      // Active ranges [min, max) must not overlap, so a request matches at most one rule
      if (is_active) {
        const others = await db.ApprovalRule.findAll({
          where: { is_active: true, ...(id ? { id: { [Op.ne]: id } } : {}) }
        })
        const clash = others.find((r) => {
          const rMin = Number(r.min_amount)
          const rMax = r.max_amount === null ? Infinity : Number(r.max_amount)
          const max = max_amount === null ? Infinity : max_amount
          return min_amount < rMax && rMin < max
        })
        if (clash) {
          throw new Error(`This range overlaps an existing rule (${fmt(clash.min_amount)} – ${fmt(clash.max_amount)})`)
        }
      }

      const values = { min_amount, max_amount, approver_id, is_active }
      if (id) {
        const rule = await db.ApprovalRule.findByPk(id)
        if (!rule) throw new Error('Approval rule not found')
        return rule.update(values, { user_id: user.id })
      }
      return db.ApprovalRule.create(values, { user_id: user.id })
    } catch (error) {
      return error
    }
  }
}
