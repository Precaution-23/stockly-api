const db = require('../../database/models')

const FALLBACK_PREFIX = 'GEN'
const PREFIX_RE = /^[A-Z]{2,6}$/

// Inventory prefix comes from the item's department; items without one use GEN
async function resolvePrefix(itemId, transaction) {
  if (!itemId) return { prefix: FALLBACK_PREFIX, departmentId: null }
  const item = await db.Item.findByPk(itemId, {
    include: [{ model: db.Department, as: 'department', attributes: ['id', 'inventory_prefix'] }],
    paranoid: false,
    transaction
  })
  if (!item?.department?.inventory_prefix) return { prefix: FALLBACK_PREFIX, departmentId: null }
  return { prefix: item.department.inventory_prefix, departmentId: item.department.id }
}

// Atomically reserves `count` consecutive numbers for a prefix, e.g. MED-0019 … MED-0021.
// The department that first uses a prefix is recorded as its owner and never overwritten.
async function reserveNumbers(prefix, count, transaction, departmentId = null) {
  const [rows] = await db.sequelize.query(
    `INSERT INTO inventory_sequences (prefix, last_number, department_id, "createdAt", "updatedAt")
     VALUES (:prefix, :count, :departmentId, now(), now())
     ON CONFLICT (prefix) DO UPDATE
       SET last_number = inventory_sequences.last_number + EXCLUDED.last_number, "updatedAt" = now()
     RETURNING last_number`,
    { replacements: { prefix, count, departmentId }, transaction }
  )
  const last = rows[0].last_number
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(last - count + 1 + i).padStart(4, '0')}`)
}

// Owner (department id, or null for GEN) of a prefix that has already issued numbers; undefined if unused
async function prefixOwner(prefix) {
  const [rows] = await db.sequelize.query(
    'SELECT department_id FROM inventory_sequences WHERE prefix = :prefix',
    { replacements: { prefix } }
  )
  return rows.length ? rows[0].department_id : undefined
}

module.exports = { FALLBACK_PREFIX, PREFIX_RE, resolvePrefix, reserveNumbers, prefixOwner }
