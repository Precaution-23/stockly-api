const { GraphQLObjectType, GraphQLNonNull, GraphQLID, GraphQLString, GraphQLInt, GraphQLList } = require('graphql')
const DateType = require('./dateType')

const NotificationType = new GraphQLObjectType({
  name: 'Notification',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    message: { type: GraphQLString },
    link: { type: GraphQLString },
    read_at: { type: DateType },
    createdAt: { type: DateType }
  })
})

const NotificationFeedType = new GraphQLObjectType({
  name: 'NotificationFeed',
  fields: () => ({
    unread_count: { type: new GraphQLNonNull(GraphQLInt) },
    items: { type: new GraphQLList(NotificationType) }
  })
})

module.exports = { NotificationType, NotificationFeedType }
