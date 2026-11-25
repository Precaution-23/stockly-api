require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('../models')
const roles = require('./roles.json')
const permissions = require('./permissions.json')

;(async () => {
  try {
    console.log('🌱 Seeding database...')

    // Seed roles
    await db.Role.bulkCreate(
      roles.map((r) => ({ ...r, createdAt: new Date(), updatedAt: new Date() })),
      { ignoreDuplicates: true, logAudit: false }
    )
    // Roles are inserted with explicit ids, which doesn't advance the id sequence
    await db.sequelize.query(`SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles))`)
    console.log('✅ Roles seeded')

    // Seed permissions per role
    for (const permConfig of permissions) {
      const role = await db.Role.findOne({ where: { name: permConfig.role } })
      if (!role) continue

      for (const resource of permConfig.resources) {
        const existing = await db.Permission.findOne({
          where: { role_id: role.id, resource: resource.name }
        })

        if (!existing) {
          await db.Permission.create(
            {
              role_id: role.id,
              resource: resource.name,
              create: resource.create,
              read: resource.read,
              update: resource.update,
              delete: resource.delete,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            { logAudit: false }
          )
        } else {
          await existing.update(
            {
              create: resource.create,
              read: resource.read,
              update: resource.update,
              delete: resource.delete
            },
            { logAudit: false }
          )
        }
      }
    }
    console.log('✅ Permissions seeded')

    // Seed default admin user
    const adminRole = await db.Role.findOne({ where: { name: 'Admin' } })
    // In production the admin password must come from SEED_ADMIN_PASSWORD (no known default goes live)
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? null : 'Admin1234!')
    if (!adminPassword) throw new Error('Set SEED_ADMIN_PASSWORD before seeding in production')
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    await db.User.findOrCreate({
      where: { email: 'admin@stockly.church' },
      defaults: {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@stockly.church',
        password: hashedPassword,
        group_name: 'admin',
        role_id: adminRole ? adminRole.id : null,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      logAudit: false
    })
    console.log('✅ Admin user seeded: admin@stockly.church' + (process.env.SEED_ADMIN_PASSWORD ? '' : ' / Admin1234!'))

    console.log('🎉 Seeding complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
})()
