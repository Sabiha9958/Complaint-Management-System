/**
 * Database Configuration
 * Handles MongoDB connection with enhanced error handling and connection events
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // MongoDB connection options for better performance and reliability
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Timeout for socket operations
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database Name: ${conn.connection.name}`);

    // Connection event listeners for monitoring
    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB Error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB Disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✓ MongoDB Reconnected");
    });

    return conn;
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
