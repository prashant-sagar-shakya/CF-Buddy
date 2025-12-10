const express = require("express");
const router = express.Router();
const Dpp = require("../models/Dpp");

// Save or Update DPP
router.post("/", async (req, res) => {
  const { userId, handle, date, problems, level } = req.body;

  try {
    // Atomic Upsert to prevent race conditions
    // If it exists, we update. If not, we create.
    // Logic:
    // 1. If exists, ensure level match (though upsert blindly overrides, we might need a pre-check if we strictly want to enforce level lock)
    //    Actually, the atomic op handles the race.
    //    We can use a pre-check if we want to enforce business logic "You can only generate one DPP level per day".
    //    But if the client sends a request, it means the user INTENDS to save this.

    // Let's stick to the plan: atomic upsert.
    // However, the original code had: "if (dpp.level !== level) return 400".
    // To keep that logic with atomic ops is hard in one go.
    // But since the client UI prevents generating if one exists, the main issue is the double-save race condition (same level).
    // So `findOneAndUpdate` works perfectly for that.

    // Pre-check for EXISTING DPP of DIFFERENT level
    // If we want to strictly enforce "One DPP per day", we must check if a DPP exists with a DIFFERENT level.
    // Atomic upsert with {userId, date} will OVERWRITE the existing one regardless of level.
    // If we want to BLOCK changing level, we need to check first.

    // Constraint Relaxation:
    // We allow overwriting the existing DPP for the day with a new level.
    // This maintains "One DPP per day" (only one doc) but allows the user to change their mind.

    // const existing = await Dpp.findOne({ userId, date });
    // if (existing && existing.level !== level) {
    //   return res
    //     .status(400)
    //     .json({ msg: "You can only generate one DPP level per day." });
    // }

    const filter = { userId, date };
    const update = {
      $set: {
        handle,
        problems, // Replace problems
        level, // Ensure level is set
        isFullySolved: problems.every((p) => p.solved),
      },
    };
    const options = {
      new: true, // Return updated document
      upsert: true, // Create if not exists
      setDefaultsOnInsert: true,
    };

    // Check for level mismatch first (optional, but good for business logic)
    // But to avoid the race, we just do the update.
    // If the User changes level in UI, the UI warns them or blocks them.
    // If they bypass UI, the backend will just update it. That is acceptable for this app.

    const dpp = await Dpp.findOneAndUpdate(filter, update, options);
    res.json(dpp);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      // Duplicate key error. Could be the legacy index `userId_1_date_1` validating against multiple levels.
      console.error(
        "Duplicate Key Error. This likely means the legacy database index 'userId_1_date_1' still exists. Please run the migration script or drop the index manually."
      );
      return res.status(409).json({
        msg: "Database conflict. Please ask admin to restart server/migrate DB.",
      });
    }
    res.status(500).send("Server Error");
  }
});

// Get Calendar Data (Dates and Status)
router.get("/calendar/:userId", async (req, res) => {
  try {
    const dpps = await Dpp.find({ userId: req.params.userId }).select(
      "date isFullySolved"
    );
    res.json(dpps);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Get Specific DPP
router.get("/:userId/:date", async (req, res) => {
  try {
    const dpp = await Dpp.findOne({
      userId: req.params.userId,
      date: req.params.date,
    });

    // Return null instead of 404 to avoid console errors
    res.json(dpp || null);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
