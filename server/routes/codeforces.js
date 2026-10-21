const express = require("express");
const router = express.Router();
const crypto = require("crypto");
// Using native fetch, available in Node.js 18+

const API_BASE_URL = "https://codeforces.com/api";
const KEY = process.env.CODEFORCES_KEY;
const SECRET = process.env.CODEFORCES_SECRET;

// In-memory cache to prevent CF rate limits (429) and optimize speed
const cache = new Map();
const MAX_CACHE_ENTRIES = 500;

const getCacheKey = (method, params) => {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `${method}?${sorted}`;
};

const getFromCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    return null;
  }
  return entry.data;
};

const getStaleFromCache = (key) => {
  const entry = cache.get(key);
  return entry ? entry.data : null;
};

const setInCache = (key, data, ttlMs) => {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, expiry: Date.now() + ttlMs });
};

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
  const cacheKey = getCacheKey(method, queryParams);

  // Return cached response if valid
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

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
    let response = await fetch(targetUrl);

    // If 429 rate limit hit, check if stale cache exists, or retry once with backoff
    if (response.status === 429) {
      const staleData = getStaleFromCache(cacheKey);
      if (staleData) {
        console.warn(
          `CF API 429 rate limit hit for [${method}]. Serving stale cached data.`
        );
        return res.json(staleData);
      }

      // Wait 1.5s and retry once
      await new Promise((resolve) => setTimeout(resolve, 1500));
      response = await fetch(targetUrl);
    }

    // Forward status code if not 200, or if CF returns error JSON
    if (!response.ok) {
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

    // Determine cache TTL:
    // - problemset: 1 hour
    // - bulk user submissions (e.g., elite solvers count >= 5000): 30 minutes
    // - normal queries: 5 minutes
    let ttlMs = 5 * 60 * 1000;
    if (method === "problemset.problems") {
      ttlMs = 60 * 60 * 1000;
    } else if (method === "user.status" && Number(queryParams.count) >= 5000) {
      ttlMs = 30 * 60 * 1000;
    } else if (method === "user.rating") {
      ttlMs = 15 * 60 * 1000;
    }

    setInCache(cacheKey, data, ttlMs);
    res.json(data);
  } catch (error) {
    console.error("Proxy Server Error:", error);
    res.status(500).json({ status: "FAILED", comment: "Internal Proxy Error" });
  }
});

module.exports = router;
