import axios from "axios";
import { CodeforcesUser, CodeforcesSubmission } from "@/types/codeforces";

// Determine API URL based on environment
// Assuming server runs on port 5000 in dev
const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://cf-buddy.onrender.com/api";

export const generateAnalyticsReport = async (
  user: CodeforcesUser,
  submissions: CodeforcesSubmission[]
): Promise<string> => {
  try {
    // Optimization: Calculate stats on client to reduce payload size
    const recentSubmissions = submissions.slice(0, 50);
    const solvedCount = submissions.filter((s) => s.verdict === "OK").length;

    const response = await axios.post(`${API_BASE_URL}/ai/generate-report`, {
      user,
      recentSubmissions,
      solvedCount,
    });

    return response.data.report || "No insights generated.";
  } catch (error: any) {
    console.error("Error generating AI report:", error);
    if (error.response && error.response.status === 403) {
      throw new Error("AI Service Permission Denied. Please contact support.");
    }
    throw new Error("Failed to generate AI report. Please try again later.");
  }
};
