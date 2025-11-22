/**
 * User Seeder
 * Seeds default admin and staff users with proper email addresses
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");
require("dotenv").config();

// Default user credentials with proper email addresses
const defaultUsers = [
  {
    name: "System Administrator",
    email: "admin@complaintportal.com",
    password: "Admin@2024",
    role: "admin",
    department: "Administration",
    phone: "9876543210",
    isActive: true,
  },
  {
    name: "John Martinez",
    email: "john.martinez@complaintportal.com",
    password: "Staff@2024",
    role: "staff",
    department: "Customer Support",
    phone: "9876543211",
    isActive: true,
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@complaintportal.com",
    password: "Staff@2024",
    role: "staff",
    department: "Technical Support",
    phone: "9876543212",
    isActive: true,
  },
  {
    name: "Michael Chen",
    email: "michael.chen@complaintportal.com",
    password: "Staff@2024",
    role: "staff",
    department: "IT Services",
    phone: "9876543213",
    isActive: true,
  },
  {
    name: "Emily Williams",
    email: "emily.williams@complaintportal.com",
    password: "Staff@2024",
    role: "staff",
    department: "Facility Management",
    phone: "9876543214",
    isActive: true,
  },
  {
    name: "Test User",
    email: "user@example.com",
    password: "User@2024",
    role: "user",
    department: null,
    phone: "9876543215",
    isActive: true,
  },
];

/**
 * Seed users into database
 */
const seedUsers = async () => {
  try {
    await connectDB();

    console.log("\n" + "=".repeat(70));
    console.log("🌱 COMPLAINT MANAGEMENT SYSTEM - USER SEEDER");
    console.log("=".repeat(70) + "\n");

    let createdCount = 0;
    let skippedCount = 0;
    const createdUsers = [];

    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(
          `⚠️  Skipped: ${userData.email.padEnd(40)} (Already exists)`
        );
        skippedCount++;
      } else {
        await User.create(userData);
        createdUsers.push(userData);
        console.log(
          `✅ Created: ${userData.email.padEnd(
            40
          )} [${userData.role.toUpperCase()}]`
        );
        createdCount++;
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 SEEDING SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ Successfully Created: ${createdCount} user(s)`);
    console.log(`⚠️  Skipped (Existing): ${skippedCount} user(s)`);
    console.log(`📈 Total Processed: ${defaultUsers.length} user(s)`);
    console.log("=".repeat(70) + "\n");

    if (createdCount > 0) {
      console.log("📋 DEFAULT LOGIN CREDENTIALS");
      console.log("=".repeat(70));
      console.log("\n🔐 ADMIN ACCOUNT:\n");
      const admin = createdUsers.find((u) => u.role === "admin");
      if (admin) {
        console.log(`   Name:       ${admin.name}`);
        console.log(`   Email:      ${admin.email}`);
        console.log(`   Password:   ${admin.password}`);
        console.log(`   Role:       ${admin.role.toUpperCase()}`);
        console.log(`   Department: ${admin.department}`);
      }

      const staffUsers = createdUsers.filter((u) => u.role === "staff");
      if (staffUsers.length > 0) {
        console.log("\n👥 STAFF ACCOUNTS:\n");
        staffUsers.forEach((staff, index) => {
          console.log(`   ${index + 1}. ${staff.name}`);
          console.log(`      Email:      ${staff.email}`);
          console.log(`      Password:   ${staff.password}`);
          console.log(`      Department: ${staff.department}\n`);
        });
      }

      const regularUsers = createdUsers.filter((u) => u.role === "user");
      if (regularUsers.length > 0) {
        console.log("👤 USER ACCOUNTS:\n");
        regularUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name}`);
          console.log(`      Email:    ${user.email}`);
          console.log(`      Password: ${user.password}\n`);
        });
      }

      console.log("=".repeat(70));
      console.log("⚠️  SECURITY WARNING:");
      console.log(
        "   • Change these default passwords immediately after first login!"
      );
      console.log(
        "   • Use the '/api/auth/change-password' endpoint to update passwords."
      );
      console.log(
        "   • Never commit .env files or credentials to version control."
      );
      console.log("=".repeat(70) + "\n");
    }

    console.log("✨ Seeding completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ SEEDING ERROR:");
    console.error("=".repeat(70));
    console.error(error);
    console.error("=".repeat(70) + "\n");
    process.exit(1);
  }
};

// Execute seeder
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
