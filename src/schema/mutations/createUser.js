const { GraphQLNonNull, GraphQLInputObjectType, GraphQLID, GraphQLString, GraphQLBoolean } = require('graphql')
const bcrypt = require('bcryptjs')
const UserType = require('../types/userType')
const db = require('../../../database/models')

const createUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: () => ({
    id: { type: GraphQLID },
    first_name: { type: new GraphQLNonNull(GraphQLString) },
    last_name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: GraphQLString },
    group_name: { type: new GraphQLNonNull(GraphQLString) },
    role_id: { type: GraphQLID },
    is_active: { type: GraphQLBoolean }
  })
})

module.exports = {
  type: UserType,
  args: { payload: { type: new GraphQLNonNull(createUserInput) } },
  async resolve(_, { payload }, context) {
    try {
      const { user: currentUser } = await context()

      if (payload.id) {
        const user = await db.User.findByPk(payload.id)
        const updateData = { ...payload }
        delete updateData.id
        delete updateData.password
        return user.update(updateData, { user_id: currentUser.id })
      }

      const hashedPassword = await bcrypt.hash(payload.password || 'Stockly1234!', 10)
      return db.User.create(
        { ...payload, password: hashedPassword },
        { user_id: currentUser.id }
      )
    } catch (error) {
      return error
    }
  }
}
