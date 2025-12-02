/**
 * Seeder Utilities
 * ----------------
 * Provides CLI commands to import or destroy sample data in MongoDB.
 *
 * Usage:
 *   node utils/seederUtils.js -i   # Import sample data
 *   node utils/seederUtils.js -d   # Destroy all data
 */

const mongoose = require("mongoose");
const logger = require("./logger");

// Models
const User = require("../models/UserModel");
const Complaint = require("../models/Complaint");
const StatusHistory = require("../models/StatusHistory");

// Database connection
const connectDB = require("../config/db");

// Sample seed data (replace with actual arrays or generators)
const users = require("../seeders/userSeeder");
const complaints = require("../seeders/complaintSeeder");

/**
 * Import sample data into the database
 */
const importData = async () => {
  try {
    await connectDB();

    // Clear existing collections
    await Promise.all([
      User.deleteMany(),
      Complaint.deleteMany(),
      StatusHistory.deleteMany(),
    ]);

    // Insert users
    const createdUsers = await User.insertMany(users);

    // Pick a regular user to assign complaints
    const assignedUser =
      createdUsers.find((u) => u.role === "user") || createdUsers[0];

    // Attach user reference and contact info to complaints
    const complaintsWithUser = complaints.map((c) => ({
      ...c,
      user: assignedUser._id,
      contactInfo: {
        name: assignedUser.name,
        email: assignedUser.email,
        phone: assignedUser.phone || "1234567890",
      },
    }));

    await Complaint.insertMany(complaintsWithUser);

    logger.info("✅ Sample data imported successfully");
  } catch (error) {
    logger.error("❌ Error importing data:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 MongoDB connection closed");
    process.exit(0);
  }
};

/**
 * Destroy all data from the database
 */
const destroyData = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "❌ Destruction aborted: Running in production environment!"
      );
      process.exit(1);
    }

    await connectDB();

    await Promise.all([
      User.deleteMany(),
      Complaint.deleteMany(),
      StatusHistory.deleteMany(),
    ]);

    logger.warn("⚠️ All data destroyed successfully");
  } catch (error) {
    logger.error("❌ Error destroying data:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 MongoDB connection closed");
    process.exit(0);
  }
};

/**
 * CLI runner
 */
const run = () => {
  const arg = process.argv[2];
  switch (arg) {
    case "-i":
      importData();
      break;
    case "-d":
      destroyData();
      break;
    default:
      logger.info(
        "Usage: node utils/seederUtils.js -i (import) | -d (destroy)"
      );
      process.exit(0);
  }
};

if (require.main === module) {
  run();
}

module.exports = { importData, destroyData };
