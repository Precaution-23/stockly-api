const fs = require('fs')
const path = require('path')
const { GraphQLObjectType } = require('graphql')

const fields = {}
const dir = fs.readdirSync(__dirname).filter((x) => x !== 'index.js' && x.endsWith('.js'))

dir.forEach((file) => {
  const name = file.replace('.js', '')
  fields[name] = require(path.join(__dirname, file))
})

const RootQuery = new GraphQLObjectType({
  name: 'RootQuery',
  fields
})

module.exports = RootQuery
