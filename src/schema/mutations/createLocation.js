const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString } = require('graphql')
const LocationType = require('../types/locationType')
const db = require('../../../database/models')
const { assertPermission } = require('../../helpers/requestAuth')

const createLocationInput = new GraphQLInputObjectType({
  name: 'CreateLocationInput',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    parent_id: { type: GraphQLID }
  })
})

module.exports = {
  type: LocationType,
  args: { payload: { type: new GraphQLNonNull(createLocationInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      assertPermission(user, 'Locations', payload.id ? 'update' : 'create')
      if (payload.id) {
        const location = await db.Location.findByPk(payload.id)
        return location.update({ name: payload.name, parent_id: payload.parent_id || null }, { user_id: user.id })
      }
      return db.Location.create(
        { name: payload.name, parent_id: payload.parent_id || null },
        { user_id: user.id }
      )
    } catch (error) {
      return error
    }
  }
}
