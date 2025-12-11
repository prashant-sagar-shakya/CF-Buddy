const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Database Connection
const MONGODB_URI = process.env.VITE_MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes
app.use("/api/dpp", require("./routes/dpp"));
app.use("/api/codeforces", require("./routes/codeforces"));
app.use("/api/ai", require("./routes/ai"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
