const { GraphQLInputObjectType, GraphQLInt, GraphQLString, GraphQLBoolean } = require('graphql')

const MAX_LIMIT = 100

// Shared paging args: { q, status, limit, offset, sortBy, sortDesc }
const pageInput = (name, extraFields = {}) =>
  new GraphQLInputObjectType({
    name,
    fields: () => ({
      q: { type: GraphQLString },
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt },
      sortBy: { type: GraphQLString },
      sortDesc: { type: GraphQLBoolean },
      ...extraFields
    })
  })

function pageWindow(payload = {}) {
  const limit = Math.min(Math.max(parseInt(payload.limit, 10) || 25, 1), MAX_LIMIT)
  const offset = Math.max(parseInt(payload.offset, 10) || 0, 0)
  return { limit, offset }
}

// Only whitelisted columns can be sorted on; `sortable` maps API keys to columns or literals
function pageOrder(payload = {}, sortable, fallback = [['createdAt', 'DESC']]) {
  const column = payload.sortBy && sortable[payload.sortBy]
  if (!column) return fallback
  return [[column, payload.sortDesc ? 'DESC' : 'ASC'], ['id', 'DESC']]
}

// Escape LIKE wildcards so a search for "50%" means the literal text
const likeTerm = (q) => `%${String(q).trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`

module.exports = { pageInput, pageWindow, pageOrder, likeTerm }
