const logger = require("../utils/logging/logger");
const Role = require("../models/role/Role");
const Permission = require("../models/role/Permission");

const permissions = [
  { key: "complaints.read", name: "View complaints", category: "Complaints" },
  {
    key: "complaints.create",
    name: "Create complaints",
    category: "Complaints",
  },
  {
    key: "complaints.update",
    name: "Update complaints",
    category: "Complaints",
  },
  {
    key: "complaints.delete",
    name: "Delete complaints",
    category: "Complaints",
  },
  {
    key: "complaints.assign",
    name: "Assign complaints",
    category: "Complaints",
  },
  { key: "users.read", name: "View users", category: "Users" },
  { key: "users.create", name: "Create users", category: "Users" },
  { key: "users.update", name: "Update users", category: "Users" },
  { key: "users.delete", name: "Delete users", category: "Users" },
  { key: "roles.manage", name: "Manage roles", category: "Administration" },
  {
    key: "permissions.manage",
    name: "Manage permissions",
    category: "Administration",
  },
  {
    key: "reports.generate",
    name: "Generate reports",
    category: "Administration",
  },
  {
    key: "settings.manage",
    name: "Manage settings",
    category: "Administration",
  },
];

const roles = [
  {
    name: "Admin",
    description: "Full system access",
    permissions: permissions.map((p) => p.key),
  },
  {
    name: "Staff",
    description: "Handle and manage complaints",
    permissions: [
      "complaints.read",
      "complaints.update",
      "complaints.assign",
      "users.read",
    ],
  },
  {
    name: "User",
    description: "Basic user access",
    permissions: ["complaints.read", "complaints.create"],
  },
];

async function importData() {
  await Promise.all([Permission.deleteMany({}), Role.deleteMany({})]);
  const [p, r] = await Promise.all([
    Permission.insertMany(permissions, { ordered: true }),
    Role.insertMany(roles, { ordered: true }),
  ]);
  logger.info(`Permissions seeded: ${p.length}`);
  logger.info(`Roles seeded: ${r.length}`);
  return { permissions: p.length, roles: r.length };
}

async function destroyData() {
  const [p, r] = await Promise.all([
    Permission.deleteMany({}),
    Role.deleteMany({}),
  ]);
  logger.warn(`Permissions deleted: ${p.deletedCount ?? 0}`);
  logger.warn(`Roles deleted: ${r.deletedCount ?? 0}`);
  return { permissions: p.deletedCount ?? 0, roles: r.deletedCount ?? 0 };
}

module.exports = { importData, destroyData };
