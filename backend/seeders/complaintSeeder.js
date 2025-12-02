const { faker } = require("@faker-js/faker");
const logger = require("../utils/logger");
const Complaint = require("../models/Complaint");
const User = require("../models/UserModel");

/**
 * Generate fake complaints with realistic data
 * @param {number} count - Number of complaints to generate
 * @param {Array} users - Array of user documents for assignment
 * @returns {Array} Array of complaint objects
 */
const generateComplaints = (count, users) => {
  const departments = ["IT", "Facilities", "HR", "Finance", "Security"];
  const statuses = ["pending", "in_progress", "resolved", "rejected", "closed"];
  const priorities = ["low", "medium", "high"];

  return Array.from({ length: count }, (_, index) => {
    const randomUser = faker.helpers.arrayElement(users);
    const createdDate = faker.date.recent({ days: 30 });

    // Generate 1-3 realistic attachments
    const attachmentCount = faker.number.int({ min: 1, max: 3 });
    const attachments = Array.from({ length: attachmentCount }, () => {
      const fileTypes = [
        { ext: "png", mime: "image/png" },
        { ext: "jpg", mime: "image/jpeg" },
        { ext: "pdf", mime: "application/pdf" },
      ];
      const fileType = faker.helpers.arrayElement(fileTypes);
      const originalName = `${faker.system.commonFileName(fileType.ext)}`;
      const uniqueFilename = `${Date.now()}_${faker.string.uuid()}_${originalName}`;

      return {
        url: `/uploads/complaints/${uniqueFilename}`, // Optional field
        filename: uniqueFilename, // Optional field
        path: `/uploads/complaints/${uniqueFilename}`, // ✅ Required: File path
        originalName: originalName, // ✅ Required: Original filename
        mimetype: fileType.mime,
        size: faker.number.int({ min: 10000, max: 5000000 }),
        uploadedAt: faker.date.between({ from: createdDate, to: new Date() }),
      };
    });

    // ✅ Generate valid 10-digit phone number (Indian format)
    const phoneNumber = `${faker.helpers.arrayElement([
      "9",
      "8",
      "7",
      "6",
    ])}${faker.string.numeric(9)}`;

    return {
      title: faker.helpers.arrayElement([
        "Network connectivity issue in office",
        "Air conditioning not working properly",
        "Payroll discrepancy for last month",
        "Broken printer in department",
        "Security access card not working",
        "Software license renewal needed",
        "Leaking ceiling in conference room",
        "Missing equipment from storage",
        "Faulty elevator needs repair",
        "Parking permit request",
        "Computer hardware malfunction",
        "Office supplies running low",
      ]),
      description: faker.lorem.paragraphs(2),
      department: faker.helpers.arrayElement(departments),
      status: faker.helpers.arrayElement(statuses),
      priority: faker.helpers.arrayElement(priorities),
      user: randomUser._id,
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.6,
      }),
      contactInfo: {
        name: randomUser.name,
        email: randomUser.email,
        phone: phoneNumber, // ✅ Valid 10-digit phone
      },
      attachments,
      createdAt: createdDate,
      updatedAt: faker.date.between({ from: createdDate, to: new Date() }),
    };
  });
};

/**
 * Import (seed) complaint data into the database
 */
const importData = async () => {
  try {
    // Clear existing complaints
    const deleteResult = await Complaint.deleteMany();
    logger.info(`🗑️  Cleared ${deleteResult.deletedCount} existing complaints`);

    // Fetch users with 'user' role
    const users = await User.find({ role: "user" }).select("_id name email");

    if (!users || users.length === 0) {
      logger.warn(
        "⚠️  No users found with role 'user'. Please seed users first."
      );
      logger.info("💡 Run: node seeders/userSeeder.js -i");
      process.exit(0);
    }

    logger.info(`👥 Found ${users.length} users`);

    // Generate complaints
    const complaintCount = 40;
    const complaints = generateComplaints(complaintCount, users);

    logger.info(`📝 Generated ${complaints.length} complaints, validating...`);

    // Insert complaints
    const insertedComplaints = await Complaint.insertMany(complaints);

    logger.info(
      `✅ Successfully seeded ${insertedComplaints.length} complaints`
    );
    logger.info(`📊 Distributed across ${users.length} users`);

    // Show distribution stats
    const statusCounts = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    logger.info("📈 Status distribution:");
    statusCounts.forEach((stat) => {
      logger.info(`   - ${stat._id}: ${stat.count}`);
    });

    process.exit(0);
  } catch (error) {
    // Handle different error types
    if (error.name === "ValidationError") {
      logger.error("❌ Validation Error:");
      Object.keys(error.errors).forEach((key) => {
        logger.error(`   - ${key}: ${error.errors[key].message}`);
      });
    } else if (error.writeErrors) {
      // MongoDB write errors (from ordered:false)
      logger.error(`❌ ${error.writeErrors.length} documents failed:`);
      error.writeErrors.slice(0, 5).forEach((err, idx) => {
        logger.error(`   [${idx + 1}] ${err.errmsg}`);
      });
    } else {
      logger.error("❌ Error seeding complaints:", error.message);
      if (process.env.NODE_ENV === "development") {
        logger.error(error.stack);
      }
    }
    process.exit(1);
  }
};

/**
 * Destroy all complaints from the database
 */
const destroyData = async () => {
  try {
    const result = await Complaint.deleteMany();

    if (result.deletedCount > 0) {
      logger.warn(
        `⚠️  Deleted ${result.deletedCount} complaint(s) from database`
      );
    } else {
      logger.info("ℹ️  No complaints found to delete");
    }

    process.exit(0);
  } catch (error) {
    logger.error("❌ Error destroying complaints:", error.message);
    process.exit(1);
  }
};

// CLI runner
if (require.main === module) {
  const arg = process.argv[2];

  if (!arg) {
    logger.info("📋 Complaint Seeder Usage:");
    logger.info("   node seeders/complaintSeeder.js -i    Import complaints");
    logger.info(
      "   node seeders/complaintSeeder.js -d    Destroy all complaints"
    );
    process.exit(0);
  }

  switch (arg) {
    case "-i":
    case "--import":
      importData();
      break;
    case "-d":
    case "--destroy":
      destroyData();
      break;
    default:
      logger.warn(`⚠️  Unknown argument: ${arg}`);
      logger.info("Use -i (import) or -d (destroy)");
      process.exit(1);
  }
}

module.exports = { importData, destroyData, generateComplaints };
