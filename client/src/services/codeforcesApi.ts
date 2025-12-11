import {
  CodeforcesSubmission,
  CodeforcesUser,
  CodeforcesProblem,
  CodeforcesRatingChange, // Assuming this is defined in your types file
} from "@/types/codeforces";

// Use backend proxy to avoid CORS and handle authentication
// Attempts to derive the base URL from the existing VITE_API_URL variable used in dppService
// Fallback to localhost for dev if not set (or use the Render URL)
const getBackendBaseUrl = () => {
  // If in dev mode and no explicit VITE_API_URL, assume local server
  if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
    return "http://localhost:5000/api/codeforces";
  }
  const dppUrl =
    import.meta.env.VITE_API_URL || "https://cf-buddy.onrender.com/api/dpp";
  // Replace /api/dpp with /api/codeforces
  return dppUrl.replace(/\/api\/dpp\/?$/, "/api/codeforces");
};

const API_BASE_URL = getBackendBaseUrl();

const getApiLanguage = (): "en" | "ru" => {
  if (typeof navigator !== "undefined") {
    const preferredLanguage = navigator.language?.toLowerCase();
    if (preferredLanguage?.startsWith("ru")) {
      return "ru";
    }
  }
  return "en";
};

const fetchWithTimeout = async (
  resource: string,
  options: RequestInit = {}
) => {
  const { timeout = 15000 } = options as any; // 15s timeout

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
};

// Primary error handler for API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "Rate limit exceeded from Codeforces API. Please try again in a few moments."
      );
    }
    let errorComment = "API request failed";
    try {
      const errorData = await response.json(); // Attempt to parse error details
      errorComment =
        errorData.comment ||
        `Codeforces API Error: ${response.status} ${response.statusText}`;
    } catch (e) {
      // If parsing errorData fails, use the response status text
      errorComment = `Codeforces API Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorComment);
  }
  const data = await response.json();
  if (data.status === "FAILED") {
    throw new Error(
      data.comment || "Codeforces API request indicated failure."
    );
  }
  return data.result; // Returns the 'result' field from the CF API response
};

export const getUserInfo = async (handle: string): Promise<CodeforcesUser> => {
  const lang = getApiLanguage();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/user.info?handles=${handle}&lang=${lang}`
  );
  const result = await handleResponse(response); // handleResponse will throw on error

  if (!result || result.length === 0) {
    // This is a valid API response (status OK), but user not found
    throw new Error(`User with handle "${handle}" not found.`);
  }
  const userInfo = result[0];
  return {
    ...userInfo,
    rank: userInfo.rank || "Unranked",
    rating: userInfo.rating || 0,
    maxRank: userInfo.maxRank || "Unranked",
    maxRating: userInfo.maxRating || 0,
    friendOfCount: userInfo.friendOfCount || 0,
  } as CodeforcesUser;
};

export const getUserSubmissions = async (
  handle: string
): Promise<CodeforcesSubmission[]> => {
  const lang = getApiLanguage();
  const apiUrl = `${API_BASE_URL}/user.status?handle=${handle}&from=1&count=10000&lang=${lang}`;
  const response = await fetchWithTimeout(apiUrl);
  const submissionsResult = await handleResponse(response); // handleResponse throws

  return submissionsResult.map(
    (sub: any) =>
      ({
        ...sub,
        id: sub.id || 0,
        creationTimeSeconds: sub.creationTimeSeconds || 0,
        relativeTimeSeconds: sub.relativeTimeSeconds || 0,
        problem: {
          contestId: sub.problem?.contestId,
          index: sub.problem?.index,
          name: sub.problem?.name || "Unknown Problem",
          type: sub.problem?.type,
          points: sub.problem?.points,
          rating: sub.problem?.rating,
          tags: Array.isArray(sub.problem?.tags) ? sub.problem.tags : [],
        },
        author: {
          contestId: sub.author?.contestId,
          members: Array.isArray(sub.author?.members)
            ? sub.author.members
            : [{ handle: "Unknown" }],
          participantType: sub.author?.participantType || "PRACTICE",
          ghost: sub.author?.ghost || false,
        },
        programmingLanguage: sub.programmingLanguage || "Unknown",
        passedTestCount: sub.passedTestCount || 0,
        timeConsumedMillis: sub.timeConsumedMillis || 0,
        memoryConsumedBytes: sub.memoryConsumedBytes || 0,
      } as CodeforcesSubmission)
  );
};

// For functions that compose other fallible API calls, a try-catch is still useful
export const getAcceptedSubmissions = async (
  handle: string
): Promise<CodeforcesSubmission[]> => {
  try {
    const submissions = await getUserSubmissions(handle);
    return submissions.filter((submission) => submission.verdict === "OK");
  } catch (error) {
    throw error;
  }
};

export const getUserRatingHistory = async (
  handle: string
): Promise<CodeforcesRatingChange[]> => {
  const lang = getApiLanguage();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/user.rating?handle=${handle}&lang=${lang}`
  );
  return await handleResponse(response); // handleResponse throws
};

// These functions below do not make API calls themselves, so no try-catch needed here.
export const getUniqueSolvedProblems = (
  submissions: CodeforcesSubmission[]
): CodeforcesProblem[] => {
  const uniqueProblems = new Map<string, CodeforcesProblem>();
  submissions.forEach((submission) => {
    if (
      submission.verdict === "OK" &&
      submission.problem?.contestId &&
      submission.problem?.index
    ) {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      if (!uniqueProblems.has(problemKey)) {
        uniqueProblems.set(problemKey, {
          contestId: submission.problem.contestId,
          index: submission.problem.index,
          name: submission.problem.name || "Unknown Problem",
          type: submission.problem.type,
          points: submission.problem.points,
          rating: submission.problem.rating,
          tags: Array.isArray(submission.problem.tags)
            ? submission.problem.tags
            : [],
        });
      }
    }
  });
  return Array.from(uniqueProblems.values());
};

// validateHandle still benefits from try-catch to convert error to boolean
export const validateHandle = async (handle: string): Promise<boolean> => {
  try {
    await getUserInfo(handle); // getUserInfo can throw (user not found, API error)
    return true;
  } catch (error) {
    return false; // Any error means validation failed
  }
};

// --- FUNCTION FOR DPP (getAllProblems) ---
let ALL_PROBLEMS_CACHE: CodeforcesProblem[] | null = null;
let ALL_PROBLEMS_CACHE_TIMESTAMP: number | null = null;
const CACHE_DURATION_MS = 1000 * 60 * 60 * 24; // Cache problemset for 24 hours
const PROBLEMS_CACHE_KEY = "cf_problems_cache";

interface ProblemsCache {
  timestamp: number;
  problems: CodeforcesProblem[];
}

export const getAllProblems = async (
  forceRefresh: boolean = false
): Promise<CodeforcesProblem[]> => {
  const now = Date.now();

  // Try to load from memory cache first
  if (
    !forceRefresh &&
    ALL_PROBLEMS_CACHE &&
    ALL_PROBLEMS_CACHE_TIMESTAMP &&
    now - ALL_PROBLEMS_CACHE_TIMESTAMP < CACHE_DURATION_MS
  ) {
    return ALL_PROBLEMS_CACHE;
  }

  // Try to load from localStorage
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(PROBLEMS_CACHE_KEY);
      if (cached) {
        const parsedCache: ProblemsCache = JSON.parse(cached);
        if (now - parsedCache.timestamp < CACHE_DURATION_MS) {
          ALL_PROBLEMS_CACHE = parsedCache.problems;
          ALL_PROBLEMS_CACHE_TIMESTAMP = parsedCache.timestamp;
          return parsedCache.problems;
        }
      }
    } catch (e) {
      console.warn("Failed to load problems from localStorage", e);
    }
  }

  const lang = getApiLanguage();
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/problemset.problems?lang=${lang}`
    );
    const result = await handleResponse(response);

    if (!result.problems || !Array.isArray(result.problems)) {
      throw new Error("Invalid problemset data structure received from API.");
    }

    const problemsWithRating = result.problems.filter(
      (p: any) => typeof p.rating === "number"
    );

    ALL_PROBLEMS_CACHE = problemsWithRating.map((p: any) => ({
      contestId: p.contestId,
      index: p.index,
      name: p.name || "Untitled Problem",
      type: p.type,
      points: p.points,
      rating: p.rating,
      tags: Array.isArray(p.tags) ? p.tags : [],
    }));
    ALL_PROBLEMS_CACHE_TIMESTAMP = now;

    // Save to localStorage
    try {
      localStorage.setItem(
        PROBLEMS_CACHE_KEY,
        JSON.stringify({
          timestamp: now,
          problems: ALL_PROBLEMS_CACHE,
        })
      );
    } catch (e) {
      console.warn(
        "Failed to save problems to localStorage (quota exceeded?)",
        e
      );
    }

    return ALL_PROBLEMS_CACHE;
  } catch (error) {
    if (ALL_PROBLEMS_CACHE) {
      console.warn(
        "Failed to refresh all problems from Codeforces API, returning stale cache:",
        error instanceof Error ? error.message : String(error)
      );
      return ALL_PROBLEMS_CACHE;
    }
    throw error;
  }
};
