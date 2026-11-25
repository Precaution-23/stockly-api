const { GraphQLObjectType, GraphQLList, GraphQLNonNull, GraphQLInt, GraphQLString } = require('graphql')
const RequestType = require('./requestType')
const InventoryType = require('./inventoryType')

const StatusCountType = new GraphQLObjectType({
  name: 'StatusCount',
  fields: () => ({
    status: { type: new GraphQLNonNull(GraphQLString) },
    count: { type: new GraphQLNonNull(GraphQLInt) }
  })
})

const RequestPageType = new GraphQLObjectType({
  name: 'RequestPage',
  fields: () => ({
    rows: { type: new GraphQLList(RequestType) },
    total: { type: new GraphQLNonNull(GraphQLInt) },
    // Counts per status for the current search (ignores the status filter), for the filter dropdown
    statusCounts: { type: new GraphQLList(StatusCountType) }
  })
})

const InventoryPageType = new GraphQLObjectType({
  name: 'InventoryPage',
  fields: () => ({
    rows: { type: new GraphQLList(InventoryType) },
    total: { type: new GraphQLNonNull(GraphQLInt) },
    totalValue: { type: GraphQLString }
  })
})

module.exports = { RequestPageType, InventoryPageType }
