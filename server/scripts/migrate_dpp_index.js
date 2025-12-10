const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" }); // Adjust path if needed, assuming run from server/scripts

const MONGODB_URI =
  process.env.VITE_MONGODB_URI ||
  "mongodb+srv://prashantshakya2003:prashant123@cluster0.b5sba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for migration...");

    const collection = mongoose.connection.collection("dpps");

    // Check existing indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes);

    const oldIndexName = "userId_1_date_1";
    const oldIndexExists = indexes.some((idx) => idx.name === oldIndexName);

    if (oldIndexExists) {
      console.log(`Dropping index: ${oldIndexName}...`);
      await collection.dropIndex(oldIndexName);
      console.log("Index dropped.");
    } else {
      console.log(`Index ${oldIndexName} not found, skipping drop.`);
    }

    // New index will be created by Mongoose when app starts and connects, due to autoIndex: true (default)
    // But we can create it here explicitly to be sure.
    // define new index: userId: 1, date: 1, level: 1 (unique)
    console.log("Creating new index: userId_1_date_1_level_1...");
    await collection.createIndex(
      { userId: 1, date: 1, level: 1 },
      { unique: true }
    );
    console.log("New index created.");

    console.log("Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
