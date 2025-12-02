/**
 * Clear Seeder Script
 * -------------------
 * Removes all data from Users, Complaints, and StatusHistory collections.
 * Usage:
 *   node seeders/clearSeeder.js -d   # Destroy all seed data
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("../utils/logger");
const connectDB = require("../config/db");

// Load environment variables
dotenv.config();

// Import models
const User = require("../models/UserModel");
const Complaint = require("../models/Complaint");
const StatusHistory = require("../models/StatusHistory");

/**
 * Clear all seed data from the database
 */
const clearData = async () => {
  await connectDB();
  try {
    const [userResult, complaintResult, statusResult] = await Promise.all([
      User.deleteMany(),
      Complaint.deleteMany(),
      StatusHistory.deleteMany(),
    ]);

    logger.warn(
      `⚠️ Seed data cleared successfully:\n` +
        `   - Users removed: ${userResult.deletedCount}\n` +
        `   - Complaints removed: ${complaintResult.deletedCount}\n` +
        `   - StatusHistory removed: ${statusResult.deletedCount}`
    );
  } catch (error) {
    logger.error("❌ Error clearing seed data:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 MongoDB connection closed");
  }
};

/**
 * CLI runner
 */
const run = async () => {
  const arg = process.argv[2];
  switch (arg) {
    case "-d":
      await clearData();
      break;
    default:
      logger.info("Usage: node seeders/clearSeeder.js -d (destroy data)");
      process.exit(0);
  }
};

// Execute only if run directly
if (require.main === module) {
  run();
}

module.exports = { clearData };
