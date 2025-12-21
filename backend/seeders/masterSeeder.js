require("dotenv/config");

const mongoose = require("mongoose");
const logger = require("../utils/logging/logger");
const connectDB = require("../config/db");

const { getCommand, getInt, hasFlag } = require("./_cli");

const {
  importData: seedUsers,
  destroyData: destroyUsers,
} = require("./userSeeder");
const {
  importData: seedComplaints,
  destroyData: destroyComplaints,
} = require("./complaintSeeder");
const {
  importData: seedRbac,
  destroyData: destroyRbac,
} = require("./rbacSeeder");
const { clearData } = require("./clearSeeder");

async function importAll() {
  const users = getInt("users", 100);
  const complaints = getInt("complaints", 100);
  const keepUsers = hasFlag("keepUsers");
  await seedRbac();
  await seedUsers({ users, keepExisting: keepUsers });
  await seedComplaints({ complaints, clearExisting: true });
}

async function destroyAll() {
  await destroyComplaints();
  await destroyUsers();
  await destroyRbac();
}

async function run() {
  const cmd = getCommand();

  if (!cmd) {
    logger.info("Usage:");
    logger.info(
      "node seeders/masterSeeder.js import --users=100 --complaints=200 [--keepUsers]"
    );
    logger.info("node seeders/masterSeeder.js destroy");
    logger.info("node seeders/masterSeeder.js clear");
    return;
  }

  await connectDB();

  if (cmd === "import") await importAll();
  if (cmd === "destroy") await destroyAll();
  if (cmd === "clear") await clearData();
}

if (require.main === module) {
  run()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((e) => {
      logger.error(`Seeder failed: ${e.message}`, { stack: e.stack });
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect().catch(() => {});
    });
}

module.exports = { importAll, destroyAll };
