/**
 * Master Seeder Script
 * --------------------
 * Provides CLI commands to import or destroy all seed data at once.
 *
 * Usage:
 *   node seeders/masterSeeder.js -i   # Import all seed data
 *   node seeders/masterSeeder.js -d   # Destroy all seed data
 *   node seeders/masterSeeder.js -c   # Clear all collections (optional full wipe)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("../utils/logger");
const connectDB = require("../config/db");

// Load environment variables
dotenv.config();

// Import individual seeders
const {
  importData: importUsers,
  destroyData: destroyUsers,
} = require("./userSeeder");
const {
  importData: importComplaints,
  destroyData: destroyComplaints,
} = require("./complaintSeeder");
const { clearData } = require("./clearSeeder");

/**
 * Import all seed data sequentially
 */
const importAllData = async () => {
  try {
    await importUsers();
    await importComplaints();
    // Add other importer calls here if needed
    logger.info("✅ All seed data imported successfully");
  } catch (error) {
    logger.error("❌ Error importing seed data:", error);
    process.exit(1);
  }
};

/**
 * Destroy all seed data sequentially
 */
const destroyAllData = async () => {
  try {
    await destroyUsers();
    await destroyComplaints();
    // Add other destroyer calls here if needed
    logger.warn("⚠️ All seed data destroyed successfully");
  } catch (error) {
    logger.error("❌ Error destroying seed data:", error);
    process.exit(1);
  }
};

/**
 * CLI runner
 */
const run = async () => {
  await connectDB();

  const arg = process.argv[2];
  try {
    switch (arg) {
      case "-i":
        await importAllData();
        break;
      case "-d":
        await destroyAllData();
        break;
      case "-c":
        await clearData();
        break;
      default:
        logger.info(
          "Usage: node seeders/masterSeeder.js -i (import) | -d (destroy) | -c (clear all)"
        );
        process.exit(0);
    }
  } catch (err) {
    logger.error("❌ Master seeder failed:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 MongoDB connection closed");
  }
};

// Execute only if run directly
if (require.main === module) {
  run();
}

module.exports = { importAllData, destroyAllData, clearData };
