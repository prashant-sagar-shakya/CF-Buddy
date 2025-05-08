import {
  CodeforcesSubmission,
  CodeforcesUser,
  CodeforcesProblem,
} from "@/types/codeforces";

const API_BASE_URL = "https://codeforces.com/api";

const getApiLanguage = (): "en" | "ru" => {
  if (typeof navigator !== "undefined") {
    const preferredLanguage = navigator.language?.toLowerCase();
    if (preferredLanguage?.startsWith("ru")) {
      return "ru";
    }
  }
  return "en";
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "Rate limit exceeded. Please try again in a few moments."
      );
    }
    let errorComment = "API request failed";
    try {
      const errorData = await response.json();
      errorComment =
        errorData.comment ||
        `API Error: ${response.status} ${response.statusText}`;
    } catch (e) {
      errorComment = `API Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorComment);
  }
  const data = await response.json();
  if (data.status === "FAILED") {
    throw new Error(data.comment || "Codeforces API request failed");
  }
  return data.result;
};

export const getUserInfo = async (handle: string): Promise<CodeforcesUser> => {
  const lang = getApiLanguage();
  const response = await fetch(
    `${API_BASE_URL}/user.info?handles=${handle}&lang=${lang}`
  );
  const result = await handleResponse(response);
  if (!result || result.length === 0) {
    throw new Error(`User with handle "${handle}" not found.`);
  }
  return result[0];
};

export const getUserSubmissions = async (
  handle: string
): Promise<CodeforcesSubmission[]> => {
  const lang = getApiLanguage();
  const apiUrl = `${API_BASE_URL}/user.status?handle=${handle}&from=1&count=10000&lang=${lang}`;
  const response = await fetch(apiUrl);
  const submissionsResult = await handleResponse(response);
  return submissionsResult.map(
    (sub: any) =>
      ({
        ...sub,
        problem: {
          ...sub.problem,
          tags: Array.isArray(sub.problem.tags) ? sub.problem.tags : [],
        },
      } as CodeforcesSubmission)
  );
};

export const getAcceptedSubmissions = async (
  handle: string
): Promise<CodeforcesSubmission[]> => {
  const submissions = await getUserSubmissions(handle);
  return submissions.filter((submission) => submission.verdict === "OK");
};

export interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export const getUserRatingHistory = async (
  handle: string
): Promise<CodeforcesRatingChange[]> => {
  const lang = getApiLanguage(); // Assuming you have this helper
  try {
    const response = await fetch(
      `${API_BASE_URL}/user.rating?handle=${handle}&lang=${lang}`
    );
    return await handleResponse(response); // Assumes handleResponse is defined
  } catch (error) {
    console.error(`Failed to fetch rating history for ${handle}:`, error);
    throw error;
  }
};

export const getUniqueSolvedProblems = (
  submissions: CodeforcesSubmission[]
): CodeforcesProblem[] => {
  const uniqueProblems = new Map<string, CodeforcesProblem>();
  submissions.forEach((submission) => {
    if (
      submission.verdict === "OK" &&
      submission.problem.contestId &&
      submission.problem.index
    ) {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      if (!uniqueProblems.has(problemKey)) {
        uniqueProblems.set(problemKey, {
          contestId: submission.problem.contestId,
          index: submission.problem.index,
          name: submission.problem.name,
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

export const validateHandle = async (handle: string): Promise<boolean> => {
  try {
    await getUserInfo(handle);
    return true;
  } catch (error) {
    return false;
  }
};
