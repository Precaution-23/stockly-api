'use strict'

const RESERVED = ['GEN']

// Suggest a prefix from the department name: first 3 letters, uppercased, made unique
function suggestPrefix(name, taken) {
  const base = (name || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(2, 'X') || 'DEP'
  let candidate = base
  for (let n = 2; taken.has(candidate) || RESERVED.includes(candidate); n++) {
    candidate = `${base.slice(0, 5)}${String.fromCharCode(64 + (n % 26 || 26))}`
  }
  taken.add(candidate)
  return candidate
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface
    const SELECT = sequelize.QueryTypes.SELECT

    await sequelize.transaction(async (transaction) => {
      // 1. Department inventory prefixes
      await queryInterface.addColumn('departments', 'inventory_prefix', { type: Sequelize.STRING(6), allowNull: true }, { transaction })
      const departments = await sequelize.query('SELECT id, name FROM departments ORDER BY id', { type: SELECT, transaction })
      const taken = new Set()
      for (const d of departments) {
        await sequelize.query('UPDATE departments SET inventory_prefix = :p WHERE id = :id', {
          replacements: { p: suggestPrefix(d.name, taken), id: d.id }, transaction
        })
      }
      await queryInterface.changeColumn('departments', 'inventory_prefix', { type: Sequelize.STRING(6), allowNull: false }, { transaction })
      await queryInterface.addIndex('departments', ['inventory_prefix'], { unique: true, name: 'departments_inventory_prefix_key', transaction })

      // 2. Running number per prefix
      await queryInterface.createTable('inventory_sequences', {
        prefix: { type: Sequelize.STRING(6), primaryKey: true, allowNull: false },
        last_number: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false }
      }, { transaction })

      // 3. Inventory number column
      await queryInterface.addColumn('inventory', 'inventory_number', { type: Sequelize.STRING(20), allowNull: true }, { transaction })

      // 4. Backfill: split multi-quantity rows into units and number them in purchase order
      const rows = await sequelize.query(
        `SELECT inv.*, COALESCE(d.inventory_prefix, 'GEN') AS prefix
         FROM inventory inv
         LEFT JOIN items it ON it.id = inv.item_id
         LEFT JOIN departments d ON d.id = it.department_id
         ORDER BY inv.purchased_at, inv.id`,
        { type: SELECT, transaction }
      )
      const counters = {}
      const next = (prefix) => {
        counters[prefix] = (counters[prefix] || 0) + 1
        return `${prefix}-${String(counters[prefix]).padStart(4, '0')}`
      }
      for (const row of rows) {
        const { id, prefix, quantity, ...rest } = row
        await sequelize.query(
          'UPDATE inventory SET quantity = 1, total_price = unit_price, inventory_number = :num WHERE id = :id',
          { replacements: { num: next(prefix), id }, transaction }
        )
        const copies = []
        for (let i = 1; i < quantity; i++) {
          copies.push({ ...rest, quantity: 1, total_price: rest.unit_price, inventory_number: next(prefix) })
        }
        if (copies.length) await queryInterface.bulkInsert('inventory', copies, { transaction })
      }
      const now = new Date()
      const seqRows = Object.entries(counters).map(([prefix, last_number]) => ({ prefix, last_number, createdAt: now, updatedAt: now }))
      if (seqRows.length) await queryInterface.bulkInsert('inventory_sequences', seqRows, { transaction })

      await queryInterface.changeColumn('inventory', 'inventory_number', { type: Sequelize.STRING(20), allowNull: false }, { transaction })
      await queryInterface.addIndex('inventory', ['inventory_number'], { unique: true, name: 'inventory_inventory_number_key', transaction })
    })
  },

  async down(queryInterface) {
    // Rows split into single units by the backfill are not merged back
    await queryInterface.removeIndex('inventory', 'inventory_inventory_number_key')
    await queryInterface.removeColumn('inventory', 'inventory_number')
    await queryInterface.dropTable('inventory_sequences')
    await queryInterface.removeIndex('departments', 'departments_inventory_prefix_key')
    await queryInterface.removeColumn('departments', 'inventory_prefix')
  }
}
