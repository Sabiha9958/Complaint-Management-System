const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");
const logger = require("../utils/logger");
const User = require("../models/UserModel");

/**
 * Hash a plain password using bcrypt
 * @param {string} plainPassword
 * @returns {Promise<string>} hashed password
 */
const hashPassword = async (plainPassword) => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  return bcrypt.hash(plainPassword, saltRounds);
};

/**
 * Generate fake users with a given role
 * @param {number} count - Number of users to generate
 * @param {string} role - Role to assign (default: "user")
 * @returns {Promise<Array>} Array of user objects
 */
const generateUsers = async (count, role = "user") => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: await hashPassword("Password@123"), // default password
      role,
      isEmailVerified: true,
      phone: faker.string.numeric(10), // Always 10 digits
    });
  }
  return users;
};

/**
 * Import (seed) user data into the database
 */
const importData = async () => {
  try {
    await User.deleteMany();

    // Base admin and staff accounts
    const baseUsers = [
      {
        name: "Zikaullah",
        email: "zikaullah@gmail.com",
        password: await hashPassword("Admin@123"),
        role: "admin",
        isEmailVerified: true,
        phone: "9876543210",
      },
      {
        name: "Kef Khan",
        email: "kefkhan@gmail.com",
        password: await hashPassword("Staff@123"),
        role: "staff",
        isEmailVerified: true,
        phone: "9876543211",
      },
      {
        name: "Madhu Kumari",
        email: "madhukumari@gmail.com",
        password: await hashPassword("Staff@123"),
        role: "staff",
        isEmailVerified: true,
        phone: "9876543212",
      },
    ];

    // Random test users
    const randomUsers = await generateUsers(20, "user");

    const allUsers = [...baseUsers, ...randomUsers];
    await User.insertMany(allUsers);

    logger.info(`✅ Successfully seeded ${allUsers.length} users`);
  } catch (error) {
    logger.error("❌ Error seeding users:", error);
    process.exit(1);
  }
};

/**
 * Destroy all users from the database
 */
const destroyData = async () => {
  try {
    const result = await User.deleteMany();
    logger.warn(`⚠️ All users destroyed (count: ${result.deletedCount})`);
  } catch (error) {
    logger.error("❌ Error destroying users:", error);
    process.exit(1);
  }
};

// CLI runner
if (require.main === module) {
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
        "Usage: node seeders/userSeeder.js -i (import) | -d (destroy)"
      );
      process.exit(0);
  }
}

module.exports = { importData, destroyData };
