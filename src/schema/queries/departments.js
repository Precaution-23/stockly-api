const { GraphQLList, GraphQLInputObjectType, GraphQLString } = require('graphql')
const { Op } = require('sequelize')
const DepartmentType = require('../types/departmentType')
const db = require('../../../database/models')

const departmentsQueryInput = new GraphQLInputObjectType({
  name: 'DepartmentsQueryInput',
  fields: () => ({
    q: { type: GraphQLString }
  })
})

module.exports = {
  type: new GraphQLList(DepartmentType),
  args: { payload: { type: departmentsQueryInput } },
  async resolve(_, { payload }, context) {
    try {
      await context()
      const where = {}
      if (payload && payload.q) {
        where.name = { [Op.iLike]: `%${payload.q}%` }
      }
      return db.Department.findAll({ where, order: [['createdAt', 'DESC']] })
    } catch (error) {
      return error
    }
  }
}
