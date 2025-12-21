const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { faker } = require("@faker-js/faker");

const logger = require("../utils/logging/logger");
const Complaint = require("../models/complaint/complaint.model");
const User = require("../models/user/user.model");

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const COMPLAINTS_DIR = path.join(UPLOADS_ROOT, "complaints");
const PUBLIC_COMPLAINTS_BASE = "/uploads/complaints";

const CATEGORIES = [
  "technical",
  "billing",
  "service",
  "product",
  "harassment",
  "safety",
  "other",
];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const TEMPLATES = {
  technical: [
    "Wi‑Fi not working in {place}",
    "System keeps restarting automatically",
    "App crashes during login",
    "Printer not responding on {floor}",
  ],
  billing: [
    "Incorrect charges on invoice #{num}",
    "Payment done but not reflected",
    "Salary discrepancy for {month}",
    "Reimbursement pending since {date}",
  ],
  service: [
    "Support response time is too slow",
    "Maintenance request not resolved",
    "Unprofessional behavior at {place}",
    "Cleaning quality is poor on {floor}",
  ],
  product: [
    "Received damaged {product}",
    "Missing accessories in {product} package",
    "{product} not matching specifications",
    "Warranty claim rejected unfairly",
  ],
  harassment: [
    "Workplace harassment by colleague",
    "Bullying incident reported at {place}",
    "Inappropriate comments by supervisor",
  ],
  safety: [
    "Emergency exit blocked near {place}",
    "Electrical hazard at {place}",
    "Slip hazard not addressed on {floor}",
    "Fire extinguisher not functional",
  ],
  other: [
    "Parking pass renewal request",
    "Noise disturbance from nearby work",
    "Temperature control issue in {place}",
    "General policy clarification needed",
  ],
};

async function ensureDir() {
  await fs.mkdir(COMPLAINTS_DIR, { recursive: true });
}

function safeFileName(name) {
  return name.replace(/[^a-z0-9-_.]/gi, "_");
}

function fillTitle(raw) {
  return raw
    .replace(
      "{place}",
      faker.helpers.arrayElement([
        "Reception",
        "Cafeteria",
        "Lab 2",
        "Room 301",
        "Building A",
      ])
    )
    .replace(
      "{floor}",
      faker.helpers.arrayElement([
        "Ground floor",
        "2nd floor",
        "3rd floor",
        "4th floor",
      ])
    )
    .replace(
      "{product}",
      faker.helpers.arrayElement([
        "Laptop",
        "Chair",
        "Monitor",
        "Keyboard",
        "Desk",
      ])
    )
    .replace("{month}", faker.date.month())
    .replace("{date}", faker.date.recent({ days: 20 }).toLocaleDateString())
    .replace("{num}", faker.string.numeric(6));
}

async function createAttachment(category) {
  await ensureDir();

  const originalName = safeFileName(
    `${category}_evidence_${faker.number.int({ min: 100, max: 999 })}.txt`
  );
  const filename = `${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}-${originalName}`;
  const absPath = path.join(COMPLAINTS_DIR, filename);

  const content = `Complaint Evidence\nCategory: ${category}\nGenerated: ${new Date().toISOString()}\n\n${faker.lorem.paragraphs(
    2
  )}\n`;
  await fs.writeFile(absPath, content);

  const stat = await fs.stat(absPath);

  return {
    url: `${PUBLIC_COMPLAINTS_BASE}/${filename}`,
    path: `${PUBLIC_COMPLAINTS_BASE}/${filename}`,
    filename,
    originalName,
    mimetype: "text/plain",
    size: stat.size,
    uploadedAt: new Date(),
  };
}

async function generateAttachments(priority, category) {
  const count =
    priority === "urgent"
      ? faker.number.int({ min: 2, max: 4 })
      : priority === "high"
      ? faker.number.int({ min: 1, max: 3 })
      : faker.number.int({ min: 0, max: 2 });

  const out = [];
  for (let i = 0; i < count; i++) out.push(await createAttachment(category));
  return out;
}

async function buildComplaint(user) {
  const category = faker.helpers.arrayElement(CATEGORIES);
  const priority = faker.helpers.arrayElement(PRIORITIES);
  const rawTitle = faker.helpers.arrayElement(TEMPLATES[category]);

  const createdAt = faker.date.recent({ days: 60 });
  const attachments = await generateAttachments(priority, category);

  return {
    title: fillTitle(rawTitle),
    description: faker.lorem.paragraphs({ min: 2, max: 3 }),
    category,
    priority,
    user: user._id,
    contactInfo: {
      name: user.name,
      email: user.email,
      phone:
        user.phone ||
        `${faker.helpers.arrayElement([
          "9",
          "8",
          "7",
          "6",
        ])}${faker.string.numeric(9)}`,
    },
    attachments,
    createdAt,
    updatedAt: createdAt,
  };
}

async function wipeAttachmentsDir() {
  await fs.rm(COMPLAINTS_DIR, { recursive: true, force: true });
  await ensureDir();
}

async function importData({ complaints = 100, clearExisting = true } = {}) {
  await ensureDir();

  if (clearExisting) {
    await Complaint.deleteMany({});
    await wipeAttachmentsDir();
  }

  const users = await User.find({ role: "user" }).select(
    "_id name email phone"
  );
  if (!users.length)
    throw new Error("No users found (role=user). Seed users first.");

  const docs = [];
  for (let i = 0; i < complaints; i++) {
    docs.push(await buildComplaint(faker.helpers.arrayElement(users)));
  }

  await Complaint.insertMany(docs, { ordered: true, runValidators: true });
  logger.info(`Complaints seeded: ${docs.length}`);

  return { inserted: docs.length };
}

async function destroyData() {
  const r = await Complaint.deleteMany({});
  await fs.rm(COMPLAINTS_DIR, { recursive: true, force: true });
  logger.warn(`Complaints deleted: ${r.deletedCount ?? 0}`);
  return { deleted: r.deletedCount ?? 0 };
}

module.exports = { importData, destroyData };
