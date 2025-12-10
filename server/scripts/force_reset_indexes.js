const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const MONGODB_URI =
  process.env.VITE_MONGODB_URI ||
  "mongodb+srv://prashantshakya2003:prashant123@cluster0.b5sba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function resetIndexes() {
  try {
    console.log("Connecting...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const collection = mongoose.connection.collection("dpps");

    console.log("Dropping all indexes...");
    try {
      await collection.dropIndexes();
      console.log("All indexes dropped.");
    } catch (e) {
      console.log("Error dropping indexes (maybe none exist?):", e.message);
    }

    console.log("Creating new index: userId_1_date_1_level_1...");
    await collection.createIndex(
      { userId: 1, date: 1, level: 1 },
      { unique: true }
    );
    console.log("New index created.");

    // Verify
    const indexes = await collection.indexes();
    console.log("Final Indexes:");
    console.dir(indexes, { depth: null });

    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

resetIndexes();
