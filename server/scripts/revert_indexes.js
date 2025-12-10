const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const MONGODB_URI =
  process.env.VITE_MONGODB_URI ||
  "mongodb+srv://prashantshakya2003:prashant123@cluster0.b5sba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function revertIndex() {
  try {
    console.log("Connecting...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const collection = mongoose.connection.collection("dpps");

    console.log("Dropping all indexes to clear multi-level index...");
    try {
      await collection.dropIndexes();
      console.log("Indexes dropped.");
    } catch (e) {
      console.log("Error/Info dropping indexes:", e.message);
    }

    console.log("Creating SINGLE DPP index: userId_1_date_1...");
    // Removing 'level' from unique constraint
    await collection.createIndex({ userId: 1, date: 1 }, { unique: true });
    console.log("Index created.");

    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

revertIndex();
