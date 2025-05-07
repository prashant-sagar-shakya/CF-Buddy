
import { CodeforcesSubmission, CodeforcesUser } from "@/types/codeforces";

const API_BASE_URL = "https://codeforces.com/api";

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    
    const errorData = await response.json();
    throw new Error(errorData.comment || "API request failed");
  }
  
  const data = await response.json();
  
  if (data.status === "FAILED") {
    throw new Error(data.comment || "API request failed");
  }
  
  return data.result;
};

// Get user info from Codeforces API
export const getUserInfo = async (handle: string): Promise<CodeforcesUser> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user.info?handles=${handle}`);
    const result = await handleResponse(response);
    return result[0];
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    throw error;
  }
};

// Get user submissions from Codeforces API - updated to fetch more submissions
export const getUserSubmissions = async (handle: string): Promise<CodeforcesSubmission[]> => {
  try {
    // Fetch more submissions (10,000 is the max allowed by the API)
    const response = await fetch(`${API_BASE_URL}/user.status?handle=${handle}&from=1&count=6000`);
    return await handleResponse(response);
  } catch (error) {
    console.error(`Failed to fetch submissions for ${handle}:`, error);
    throw error;
  }
};

// Get accepted submissions for a handle
export const getAcceptedSubmissions = async (handle: string): Promise<CodeforcesSubmission[]> => {
  try {
    const submissions = await getUserSubmissions(handle);
    return submissions.filter(submission => submission.verdict === "OK");
  } catch (error) {
    console.error(`Failed to fetch accepted submissions for ${handle}:`, error);
    throw error;
  }
};

// Get unique solved problems from submissions
export const getUniqueSolvedProblems = (submissions: CodeforcesSubmission[]) => {
  const uniqueProblems = new Map();
  
  submissions.forEach(submission => {
    if (submission.verdict === "OK") {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      if (!uniqueProblems.has(problemKey)) {
        uniqueProblems.set(problemKey, submission.problem);
      }
    }
  });
  
  return Array.from(uniqueProblems.values());
};

// Validate if a handle exists on Codeforces
export const validateHandle = async (handle: string): Promise<boolean> => {
  try {
    await getUserInfo(handle);
    return true;
  } catch (error) {
    return false;
  }
};
