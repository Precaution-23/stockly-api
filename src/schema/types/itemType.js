const { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLBoolean } = require('graphql')
const DateType = require('./dateType')
const db = require('../../../database/models')

const ItemType = new GraphQLObjectType({
  name: 'Item',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    department_id: { type: GraphQLID },
    department: {
      type: require('./departmentType'),
      async resolve(parent) {
        if (!parent.department_id) return null
        return db.Department.findByPk(parent.department_id)
      }
    },
    is_approved: { type: GraphQLBoolean },
    created_by: { type: GraphQLID },
    creator: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.created_by) return null
        return db.User.findByPk(parent.created_by)
      }
    },
    createdAt: { type: DateType },
    updatedAt: { type: DateType }
  })
})

module.exports = ItemType
