const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Database Connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.VITE_MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "FATAL ERROR: MONGODB_URI is not set! Please configure MONGODB_URI or MONGO_URI in your environment variables."
  );
} else {
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((err) => console.error("MongoDB Connection Error:", err.message));
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

// Routes
app.use("/api/dpp", require("./routes/dpp"));
app.use("/api/codeforces", require("./routes/codeforces"));
app.use("/api/ai", require("./routes/ai"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
