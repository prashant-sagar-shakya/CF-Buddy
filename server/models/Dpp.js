const mongoose = require("mongoose");

const DppSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  handle: {
    type: String,
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
  problems: [
    {
      contestId: Number,
      index: String,
      name: String,
      rating: Number,
      tags: [String],
      link: String,
      category: { type: String, enum: ["main", "warmup"], default: "main" },
      solved: { type: Boolean, default: false },
      solvedByElite: [
        {
          handle: String,
          submissionId: Number,
          contestId: Number,
          problemIndex: String,
        },
      ],
    },
  ],
  isFullySolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one DPP per user per day
DppSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Dpp", DppSchema);
