/**
 * Clear Users Seeder
 * Removes all users from database (Development only)
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");
require("dotenv").config();

/**
 * Clear all users from database
 */
const clearUsers = async () => {
  try {
    await connectDB();

    console.log("\n" + "=".repeat(70));
    console.log("🗑️  CLEARING ALL USERS FROM DATABASE");
    console.log("=".repeat(70) + "\n");

    // Count users before deletion
    const count = await User.countDocuments();

    if (count === 0) {
      console.log("ℹ️  No users found in database.\n");
      process.exit(0);
    }

    // Ask for confirmation (in production, you might want to add a prompt)
    console.log(`⚠️  WARNING: About to delete ${count} user(s)!`);
    console.log("   This action cannot be undone.\n");

    // Delete all users
    await User.deleteMany({});

    console.log("=".repeat(70));
    console.log(`✅ Successfully deleted ${count} user(s) from database`);
    console.log("=".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR CLEARING USERS:");
    console.error("=".repeat(70));
    console.error(error);
    console.error("=".repeat(70) + "\n");
    process.exit(1);
  }
};

// Execute clearer
if (require.main === module) {
  clearUsers();
}

module.exports = clearUsers;
