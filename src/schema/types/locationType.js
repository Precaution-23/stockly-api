const { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString } = require('graphql')
const DateType = require('./dateType')
const db = require('../../../database/models')

const LocationType = new GraphQLObjectType({
  name: 'Location',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    parent_id: { type: GraphQLID },
    parent_location: {
      type: require('./locationType'),
      async resolve(parent) {
        if (!parent.parent_id) return null
        return db.Location.findByPk(parent.parent_id)
      }
    },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = LocationType
