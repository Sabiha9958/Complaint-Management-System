const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: process.env.NODE_ENV === "production" ? 50 : 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== "production", // auto-disable in prod
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log("===============================================");
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database Name:    ${conn.connection.name}`);
    console.log("===============================================");

    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB Error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB Disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✓ MongoDB Reconnected");
    });

    mongoose.connection.on("connected", () => {
      console.log("✓ MongoDB Connection Established");
    });

    return conn;
  } catch (error) {
    console.error("===============================================");
    console.error(`❌ Database Connection Error: ${error.message}`);
    console.error("===============================================");
    process.exit(1);
  }
};

module.exports = connectDB;
