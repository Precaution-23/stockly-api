const { GraphQLNonNull, GraphQLID, GraphQLBoolean } = require('graphql')
const db = require('../../../database/models')

module.exports = {
  type: GraphQLBoolean,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
  async resolve(_, { id }, context) {
    try {
      const { user } = await context()
      const department = await db.Department.findByPk(id)
      if (!department) throw new Error('Department not found')

      const itemCount = await db.Item.count({ where: { department_id: id } })
      if (itemCount > 0) throw new Error('Cannot delete this department while it is assigned to active items')

      await department.destroy({ user_id: user.id })
      return true
    } catch (error) {
      return error
    }
  }
}
