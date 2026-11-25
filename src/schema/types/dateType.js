const { GraphQLScalarType, Kind } = require('graphql')

const DateType = new GraphQLScalarType({
  name: 'Date',
  description: 'Date/time value as ISO 8601 string',
  serialize(value) {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'string' || typeof value === 'number') return new Date(value).toISOString()
    return null
  },
  parseValue(value) {
    return new Date(value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value)
    return null
  }
})

module.exports = DateType
