const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const MONGODB_URI =
  process.env.VITE_MONGODB_URI ||
  "mongodb+srv://prashantshakya2003:prashant123@cluster0.b5sba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function checkIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected...");
    const indexes = await mongoose.connection.collection("dpps").indexes();
    console.log("Indexes on 'dpps':");
    console.dir(indexes, { depth: null });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkIndexes();
