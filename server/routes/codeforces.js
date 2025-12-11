const express = require("express");
const router = express.Router();
const crypto = require("crypto");
// Using native fetch, available in Node.js 18+

const API_BASE_URL = "https://codeforces.com/api";
const KEY = process.env.CODEFORCES_KEY;
const SECRET = process.env.CODEFORCES_SECRET;

// Helper to generate signature
const generateSignature = (method, params) => {
  const rand = Math.floor(100000 + Math.random() * 900000); // 6 digit random
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const sigBase = `${rand}/${method}?${paramString}#${SECRET}`;
  const hash = crypto.createHash("sha512").update(sigBase).digest("hex");
  return `${rand}${hash}`;
};

// Generic Proxy Handler
// Usage: GET /api/codeforces/:method?param1=val&...
// Example: GET /api/codeforces/user.info?handles=tourist
router.get("/:method", async (req, res) => {
  const { method } = req.params;
  const queryParams = { ...req.query };

  // Add Auth Params
  if (KEY && SECRET) {
    queryParams.apiKey = KEY;
    queryParams.time = Math.floor(Date.now() / 1000);
    queryParams.apiSig = generateSignature(method, queryParams);
  }

  // Build URL
  const queryString = new URLSearchParams(queryParams).toString();
  const targetUrl = `${API_BASE_URL}/${method}?${queryString}`;

  try {
    const response = await fetch(targetUrl);

    // Forward status code if not 200, or if CF returns error JSON
    if (!response.ok) {
      // If CF returns 429 or 400, strictly forward it
      const errorText = await response.text();
      console.error(
        `CF API Error [${method}]: ${response.status} - ${errorText}`
      );
      try {
        const json = JSON.parse(errorText);
        return res.status(response.status).json(json);
      } catch (e) {
        return res.status(response.status).send(errorText);
      }
    }

    const data = await response.json();

    // CF API sometimes returns 200 OK but status: "FAILED" in body
    if (data.status === "FAILED") {
      console.error(`CF API Logical Failure [${method}]:`, data.comment);
      return res.status(400).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Proxy Server Error:", error);
    res.status(500).json({ status: "FAILED", comment: "Internal Proxy Error" });
  }
});

module.exports = router;
