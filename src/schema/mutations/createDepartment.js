const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString } = require('graphql')
const { Op } = require('sequelize')
const DepartmentType = require('../types/departmentType')
const db = require('../../../database/models')
const { assertPermission } = require('../../helpers/requestAuth')
const { FALLBACK_PREFIX, PREFIX_RE, prefixOwner } = require('../../helpers/inventoryNumber')

const createDepartmentInput = new GraphQLInputObjectType({
  name: 'CreateDepartmentInput',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    tag: { type: GraphQLString },
    inventory_prefix: { type: new GraphQLNonNull(GraphQLString) }
  })
})

module.exports = {
  type: DepartmentType,
  args: { payload: { type: new GraphQLNonNull(createDepartmentInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user } = await context()
      assertPermission(user, 'Configurations', payload.id ? 'update' : 'create')
      const { id, name, description, tag } = payload

      // Prefix drives inventory numbers (e.g. MED-0001); changing it only affects future items
      const inventory_prefix = payload.inventory_prefix.trim().toUpperCase()
      if (!PREFIX_RE.test(inventory_prefix)) throw new Error('Inventory prefix must be 2–6 letters (A–Z)')
      if (inventory_prefix === FALLBACK_PREFIX) {
        throw new Error(`"${FALLBACK_PREFIX}" is reserved for items without a department`)
      }
      const clash = await db.Department.findOne({
        where: { inventory_prefix, ...(id ? { id: { [Op.ne]: id } } : {}) },
        paranoid: false
      })
      if (clash) throw new Error(`Inventory prefix "${inventory_prefix}" is already used by ${clash.name.trim()}`)

      // A prefix that has issued numbers belongs to the department that issued them
      const owner = await prefixOwner(inventory_prefix)
      if (owner !== undefined && String(owner) !== String(id)) {
        throw new Error(`Inventory prefix "${inventory_prefix}" has already been used for other inventory numbers and can't be reused`)
      }

      if (id) {
        const department = await db.Department.findByPk(id)
        if (!department) throw new Error('Department not found')
        return department.update({ name, description, tag, inventory_prefix }, { user_id: user.id })
      }
      return db.Department.create({ name, description, tag, inventory_prefix }, { user_id: user.id })
    } catch (error) {
      return error
    }
  }
}
