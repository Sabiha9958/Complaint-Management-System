const logger = require("../utils/logging/logger");

const User = require("../models/user/user.model");
const Complaint = require("../models/complaint/complaint.model");
const StatusHistory = require("../models/complaint/statusHistory.model");

const Role = require("../models/role/Role");
const Permission = require("../models/role/Permission");

async function clearData() {
  const [users, complaints, statuses, roles, permissions] = await Promise.all([
    User.deleteMany({}),
    Complaint.deleteMany({}),
    StatusHistory.deleteMany({}),
    Role.deleteMany({}),
    Permission.deleteMany({}),
  ]);

  logger.warn(
    `Cleared Users=${users.deletedCount ?? 0} Complaints=${
      complaints.deletedCount ?? 0
    } StatusHistory=${statuses.deletedCount ?? 0} Roles=${
      roles.deletedCount ?? 0
    } Permissions=${permissions.deletedCount ?? 0}`
  );

  return {
    users: users.deletedCount ?? 0,
    complaints: complaints.deletedCount ?? 0,
    statusHistory: statuses.deletedCount ?? 0,
    roles: roles.deletedCount ?? 0,
    permissions: permissions.deletedCount ?? 0,
  };
}

module.exports = { clearData };
