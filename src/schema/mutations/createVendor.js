const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString } = require('graphql')
const VendorType = require('../types/vendorType')
const db = require('../../../database/models')

const createVendorInput = new GraphQLInputObjectType({
  name: 'CreateVendorInput',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString }
  })
})

module.exports = {
  type: VendorType,
  args: { payload: { type: new GraphQLNonNull(createVendorInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      if (payload.id) {
        const vendor = await db.Vendor.findByPk(payload.id)
        return vendor.update({ name: payload.name, description: payload.description }, { user_id: user.id })
      }
      return db.Vendor.create({ name: payload.name, description: payload.description }, { user_id: user.id })
    } catch (error) {
      return error
    }
  }
}
