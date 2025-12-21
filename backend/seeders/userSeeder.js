const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");

const logger = require("../utils/logging/logger");
const User = require("../models/user/user.model");

const fetchFn = global.fetch || require("node-fetch");

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const AVATARS_DIR = path.join(UPLOADS_ROOT, "users", "avatars");
const PUBLIC_AVATARS_BASE = "/uploads/users/avatars";

const JOB_TITLES = [
  "Software Engineer",
  "Support Executive",
  "Operations Associate",
  "HR Executive",
  "QA Engineer",
  "Accountant",
  "Product Analyst",
  "Customer Success Associate",
  "DevOps Engineer",
];

const DEPARTMENTS = [
  "Engineering",
  "Support",
  "Operations",
  "Human Resources",
  "Finance",
  "Product",
  "Quality Assurance",
];

const INDIA_LOCATIONS = [
  "Nārnaund, Haryana, India",
  "Gurugram, Haryana, India",
  "Faridabad, Haryana, India",
  "Chandigarh, Chandigarh, India",
  "Delhi, India",
  "Jaipur, Rajasthan, India",
  "Noida, Uttar Pradesh, India",
];

async function ensureDirs() {
  await fs.mkdir(AVATARS_DIR, { recursive: true });
}

function indianPhone() {
  return `${faker.helpers.arrayElement([
    "9",
    "8",
    "7",
    "6",
  ])}${faker.string.numeric(9)}`;
}

async function hashPassword(plain) {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  return bcrypt.hash(plain, saltRounds);
}

function bio({ name, title, department, location }) {
  return `${name} works in ${department} as a ${title}. Based in ${location}. ${faker.lorem.sentence(
    { min: 10, max: 18 }
  )}`;
}

async function downloadAvatar() {
  const remoteUrl = faker.image.avatar();
  const res = await fetchFn(remoteUrl);
  if (!res.ok)
    throw new Error(`Avatar download failed: ${res.status} ${res.statusText}`);

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const ext = ct.includes("png")
    ? "png"
    : ct.includes("webp")
    ? "webp"
    : ct.includes("jpeg") || ct.includes("jpg")
    ? "jpg"
    : "jpg";

  const fileName = `${Date.now()}-${crypto
    .randomBytes(8)
    .toString("hex")}.${ext}`;
  const absPath = path.join(AVATARS_DIR, fileName);

  const arrayBuffer = await res.arrayBuffer();
  await fs.writeFile(absPath, Buffer.from(arrayBuffer));

  return `${PUBLIC_AVATARS_BASE}/${fileName}`;
}

async function profilePicture() {
  try {
    return await downloadAvatar();
  } catch (e) {
    logger.warn(`Avatar download skipped: ${e.message}`);
    return null;
  }
}

async function buildUser({
  role = "user",
  password = "Password@123",
  fixed = {},
} = {}) {
  const sex = faker.helpers.arrayElement(["male", "female"]);
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName(sex);

  const name = `${firstName} ${lastName}`;
  const title = faker.helpers.arrayElement(JOB_TITLES);
  const department = faker.helpers.arrayElement(DEPARTMENTS);
  const location = faker.helpers.arrayElement(INDIA_LOCATIONS);

  const createdAt = faker.date.between({
    from: new Date("2024-01-01"),
    to: new Date(),
  });

  return {
    name,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: indianPhone(),
    password: await hashPassword(password),
    role,
    isEmailVerified:
      faker.helpers.maybe(() => true, { probability: 0.85 }) ?? false,
    title,
    department,
    location,
    bio: bio({ name, title, department, location }),
    profilePicture: await profilePicture(),
    coverId: faker.number.int({ min: 1, max: 50 }),
    createdAt,
    ...fixed,
  };
}

async function generateUsers(count, role = "user") {
  const out = [];
  for (let i = 0; i < count; i++) out.push(await buildUser({ role }));
  return out;
}

async function importData({ users = 100, keepExisting = false } = {}) {
  await ensureDirs();

  if (!keepExisting) {
    await User.deleteMany({});
    logger.info("Users cleared");
  }

  const adminUsers = [
    await buildUser({
      role: "admin",
      password: "Admin@123",
      fixed: {
        name: "Zikaullah",
        email: "zikaullah@gmail.com",
        phone: "9876543210",
        isEmailVerified: true,
        title: "System Administrator",
        department: "Engineering",
        location: "Nārnaund, Haryana, India",
        bio: "Zikaullah manages system access, roles, and platform configuration.",
        createdAt: new Date("2024-01-01"),
      },
    }),
  ];

  const staffUsers = [
    await buildUser({
      role: "staff",
      password: "Staff@123",
      fixed: {
        name: "Kef Khan",
        email: "kefkhan@gmail.com",
        phone: "9876543211",
        isEmailVerified: true,
        title: "Support Executive",
        department: "Support",
        location: "Gurugram, Haryana, India",
        bio: "Kef Khan handles user tickets and escalations.",
        createdAt: new Date("2024-01-15"),
      },
    }),
    await buildUser({
      role: "staff",
      password: "Staff@123",
      fixed: {
        name: "Madhu Kumari",
        email: "madhukumari@gmail.com",
        phone: "9876543212",
        isEmailVerified: true,
        title: "Operations Associate",
        department: "Operations",
        location: "Faridabad, Haryana, India",
        bio: "Madhu Kumari supports day-to-day operations and verification.",
        createdAt: new Date("2024-02-01"),
      },
    }),
  ];

  const randomUsers = await generateUsers(users, "user");
  const all = [...adminUsers, ...staffUsers, ...randomUsers];

  await User.insertMany(all, { ordered: true });
  logger.info(`Users seeded: ${all.length}`);

  return { inserted: all.length };
}

async function destroyData() {
  const r = await User.deleteMany({});
  logger.warn(`Users deleted: ${r.deletedCount ?? 0}`);
  return { deleted: r.deletedCount ?? 0 };
}

module.exports = { importData, destroyData, generateUsers };
