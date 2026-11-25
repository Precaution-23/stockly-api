const {
  GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString
} = require('graphql')
const DateType = require('./dateType')
const db = require('../../../database/models')

const AuditLogType = new GraphQLObjectType({
  name: 'AuditLog',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    user_id: { type: GraphQLID },
    action_type: { type: new GraphQLNonNull(GraphQLString) },
    model: { type: new GraphQLNonNull(GraphQLString) },
    model_id: { type: GraphQLID },
    record_name: {
      type: GraphQLString,
      async resolve(parent) {
        const Model = db[parent.model]
        if (!Model) return null
        const record = await Model.findByPk(parent.model_id)
        if (!record) return null
        return record.auditDescription ? record.auditDescription() : null
      }
    },
    diff: { type: GraphQLString },
    user: {
      type: require('./userType'),
      async resolve(parent) {
        if (!parent.user_id) return null
        return db.User.findByPk(parent.user_id)
      }
    },
    createdAt: { type: DateType }
  })
})

module.exports = AuditLogType
