// Every resource a role can hold permissions for (keep in sync with database/seeds/permissions.json)
const RESOURCES = [
  'Dashboard',
  'Requests',
  'Inventory',
  'Items',
  'Locations',
  'Vendors',
  'Users',
  'Roles',
  'AuditLogs',
  'Configurations'
]

module.exports = { RESOURCES }
