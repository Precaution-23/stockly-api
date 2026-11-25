const { GraphQLList, GraphQLInputObjectType, GraphQLString } = require('graphql')
const { Op } = require('sequelize')
const VendorType = require('../types/vendorType')
const db = require('../../../database/models')

const vendorsQueryInput = new GraphQLInputObjectType({
  name: 'VendorsQueryInput',
  fields: () => ({
    q: { type: GraphQLString }
  })
})

module.exports = {
  type: new GraphQLList(VendorType),
  args: { payload: { type: vendorsQueryInput } },
  async resolve(_, { payload }, context) {
    try {
      await context()
      const where = {}
      if (payload && payload.q) {
        where.name = { [Op.iLike]: `%${payload.q}%` }
      }
      return db.Vendor.findAll({ where, order: [['createdAt', 'DESC']] })
    } catch (error) {
      return error
    }
  }
}
