const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString } = require('graphql')
const { Op, fn, col, where } = require('sequelize')
const RoleType = require('../types/roleType')
const db = require('../../../database/models')
const { hasPermission } = require('../../helpers/requestAuth')
const { RESOURCES } = require('../../helpers/resources')

const createRoleInput = new GraphQLInputObjectType({
  name: 'CreateRoleInput',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString }
  })
})

module.exports = {
  type: RoleType,
  args: { payload: { type: new GraphQLNonNull(createRoleInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      if (!hasPermission(user, 'Roles', payload.id ? 'update' : 'create')) throw new Error('Not authorized')

      const name = payload.name.trim()
      if (!name) throw new Error('Role name is required')

      // Role names are unique in the DB, soft-deleted ones included
      const duplicate = await db.Role.findOne({
        where: {
          [Op.and]: [
            where(fn('lower', col('name')), name.toLowerCase()),
            ...(payload.id ? [{ id: { [Op.ne]: payload.id } }] : [])
          ]
        },
        paranoid: false
      })
      if (duplicate) throw new Error('A role with this name already exists')

      if (payload.id) {
        const role = await db.Role.findByPk(payload.id)
        if (!role) throw new Error('Role not found')
        return role.update({ name, description: payload.description }, { user_id: user.id })
      }

      // New roles start with every resource denied, so the permission grid can edit them
      return db.sequelize.transaction(async (transaction) => {
        const role = await db.Role.create({ name, description: payload.description }, { user_id: user.id, transaction })
        await db.Permission.bulkCreate(
          RESOURCES.map((resource) => ({
            role_id: role.id, resource, create: false, read: false, update: false, delete: false
          })),
          { transaction }
        )
        return role
      })
    } catch (error) {
      return error
    }
  }
}
