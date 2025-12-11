const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini API
// ERROR HANDLING: Ensure API Key is present
const apiKey = process.env.GEMINI_API_KEY;

let ai;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
} else {
  ai = new GoogleGenAI({ apiKey: apiKey });
}

router.post("/generate-report", async (req, res) => {
  try {
    if (!ai) {
      return res
        .status(500)
        .json({ error: "Server AI configuration missing." });
    }

    const { user, recentSubmissions, solvedCount } = req.body;

    if (!user || !recentSubmissions) {
      return res
        .status(400)
        .json({ error: "Missing user or submissions data." });
    }

    // Data is already pre-processed by client to save bandwidth
    const rating = user.rating;
    const rank = user.rank;
    const maxRating = user.maxRating;

    const prompt = `
      You are an expert competitive programming coach. Analyze the following Codeforces user profile and recent activity to provide a concise, actionable, and motivating report.

      **User Profile:**
      - Handle: ${user.handle}
      - Current Rating: ${rating} (${rank})
      - Max Rating: ${maxRating}
      - Total Solved: ${solvedCount}

      **Recent Activity Context:**
      - Analyzed last ${recentSubmissions.length} submissions.
      
      **Available DPP Levels (Daily Practice Problems):**
      - Level 1: Newbie (800-1100)
      - Level 2: Pupil (1200-1300)
      - Level 3: Specialist (1400-1500)
      - Level 4: Expert (1600-1700)
      - Level 5: Candidate Master (1800-1900)
      - Level 6: Master (2000-2100)
      - Level 7: International Master (2200-2300)
      - Level 8: Grandmaster (2400-2500)
      - Level 9: International Grandmaster (2600-2800)
      - Level 10: Legendary Grandmaster (2900-3500)

      **Task:**
      Provide a "Coach's Report" with the following sections (use Markdown). **Keep everything extremely concise and short.**
      1.  **Strengths**: Short bullet points on what they do well.
      2.  **Weaknesses**: Short bullet points on bottlenecks.
      3.  **Target Topics**: List specific topics to focus on.
      4.  **Recommended DPP Level**: Which Level (1-10)? Brief reason.
      5.  **Actionable Advice**: 1-2 specific steps.
      6.  **Motivation**: One punchy line.

      **CRITICAL: Keep the entire response under 150 words. Be direct and crisp.**
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "No insights generated.";
    res.json({ report: text });
  } catch (error) {
    console.error("Error generating AI report:", error);
    // Determine if it is a 403 or other known error
    if (error.status === 403) {
      return res
        .status(403)
        .json({ error: "AI Service Permission Denied (Key Invalid/Expired)." });
    }
    res
      .status(500)
      .json({ error: "Failed to generate AI report. Please try again later." });
  }
});

module.exports = router;
