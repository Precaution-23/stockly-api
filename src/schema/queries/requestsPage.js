const { Op } = require('sequelize')
const { RequestPageType } = require('../types/pageTypes')
const db = require('../../../database/models')
const { assertGroup } = require('../../helpers/requestAuth')
const { pageInput, pageWindow, pageOrder, likeTerm } = require('../../helpers/paging')
const { GraphQLString } = require('graphql')

const SORTABLE = {
  item_name: 'item_name',
  quantity: 'quantity',
  unit_price: 'unit_price',
  total_price: db.sequelize.literal('unit_price * quantity'),
  needed_by_date: 'needed_by_date',
  status: 'status',
  createdAt: 'createdAt'
}

// Paged version of `requests` for the Manage tab (all church requests)
module.exports = {
  type: RequestPageType,
  args: { payload: { type: pageInput('RequestsPageInput', { status: { type: GraphQLString } }) } },
  async resolve(_, { payload = {} }, context) {
    try {
      const { user } = await context()
      assertGroup(user, ['admin', 'operation', 'finance'])

      const base = []
      // Finance cannot see pending requests
      if (user.group_name === 'finance') base.push({ status: { [Op.ne]: 'pending' } })
      if (payload.q && payload.q.trim()) base.push({ item_name: { [Op.iLike]: likeTerm(payload.q) } })

      const where = { [Op.and]: payload.status && payload.status !== 'all' ? [...base, { status: payload.status }] : base }
      const { limit, offset } = pageWindow(payload)

      const [{ rows, count }, counts] = await Promise.all([
        db.Request.findAndCountAll({ where, order: pageOrder(payload, SORTABLE), limit, offset }),
        db.Request.findAll({
          where: { [Op.and]: base },
          attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
          group: ['status'],
          raw: true
        })
      ])

      return {
        rows,
        total: count,
        statusCounts: counts.map((c) => ({ status: c.status, count: Number(c.count) }))
      }
    } catch (error) {
      return error
    }
  }
}
