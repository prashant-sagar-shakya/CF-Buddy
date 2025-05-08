// src/pages/AnalyticsPage.tsx (or components/AnalyticsPage.tsx if used within a larger page)
import React, { useEffect, useState } from "react";
import { useUserContext } from "@/context/UserContext"; // Adjust path
import {
  getUserSubmissions,
  getUniqueSolvedProblems,
  getUserRatingHistory,
} from "@/services/codeforcesApi"; // Adjust path
import {
  processRatingHistory,
  processSubmissionsForAnalytics,
  OverallAnalyticsData,
  ActivityPoint,
} from "@/services/analyticsHelpers"; // Adjust path
import { CodeforcesSubmission, CodeforcesProblem } from "@/types/codeforces"; // Adjust path
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Adjust path

// Import chart components
import RatingHistoryChart from "@/components/charts/RatingHistoryChart";
import ActivityHeatmapChart from "@/components/charts/ActivityHeatmapChart";
import ProblemRatingsBarChart from "@/components/charts/ProblemRatingsBarChart";
import TagsSolvedPieChart from "@/components/charts/TagsSolvedPieChart";

interface AnalyticsPageProps {
  // Optionally pass a handle, or use the one from UserContext
  handleProp?: string;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ handleProp }) => {
  const { userState } = useUserContext();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] =
    useState<OverallAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetHandle = handleProp || userState.currentUser;

  useEffect(() => {
    if (!targetHandle) {
      setIsLoading(false);
      setError("No Codeforces handle selected or provided.");
      setAnalyticsData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setAnalyticsData(null);

      try {
        // Fetch all necessary data in parallel
        const [submissions, ratingHistoryChanges] = await Promise.all([
          getUserSubmissions(targetHandle),
          getUserRatingHistory(targetHandle),
        ]);

        const uniqueSolved = getUniqueSolvedProblems(
          submissions.filter((s) => s.verdict === "OK")
        );

        // Process data
        const ratingHistory = processRatingHistory(ratingHistoryChanges);
        const submissionAnalytics = processSubmissionsForAnalytics(
          submissions,
          uniqueSolved
        );

        setAnalyticsData({
          ratingHistory,
          ...submissionAnalytics,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load analytics data.";
        console.error("Analytics Error:", message);
        setError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [targetHandle, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">
          Loading analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No analytics data to display.
      </div>
    );
  }

  const {
    ratingHistory,
    activityHeatmap,
    problemsSolvedAllTime,
    problemsSolvedLastYear,
    problemsSolvedLastMonth,
    maxStreakAllTime,
    maxStreakLastYear,
    problemRatingDistribution,
    tagDistribution,
  } = analyticsData;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8 space-y-10">
      <h1 className="sm:text-xl md:text-2xl lg:text-3xl font-bold text-center mb-8 text-foreground text-white">
        Codeforces Analytics for{" "}
        <span className="text-primary dark:text-dark-purple">
          {targetHandle}
        </span>
      </h1>

      {/* Section 1: Rating History */}
      <section className="p-4 sm:p-2 bg-card dark:bg-neutral-800/50 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-foreground dark:text-neutral-200">
          Rating History
        </h2>
        <RatingHistoryChart data={ratingHistory} handle={targetHandle!} />
      </section>

      {/* Section 2: Activity Overview */}
      <section className="p-3 sm:p-4 lg:p-6 bg-card dark:bg-neutral-800/50 rounded-xl shadow-lg">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center sm:text-left text-foreground dark:text-neutral-200">
          Activity Overview
        </h2>

        {/* Heatmap Container (Same as previous example - scrollable) */}
        <div className="heatmap-scroll-container mb-6 lg:mb-8 p-2 bg-background dark:bg-neutral-900/50 rounded-lg overflow-x-auto scrollbar-thin scrollbar-thumb-primary/50 dark:scrollbar-thumb-dark-purple/50 scrollbar-track-transparent">
          <style>{`
        .heatmap-scroll-container::-webkit-scrollbar { height: 6px; }
        .heatmap-scroll-container::-webkit-scrollbar-thumb { background-color: var(--scrollbar-thumb-color, #A855F7); border-radius: 3px; }
        .heatmap-scroll-container::-webkit-scrollbar-track { background: transparent; }
     `}</style>
          <div className="min-w-[600px] sm:min-w-[700px]">
            <ActivityHeatmapChart data={activityHeatmap as ActivityPoint[]} />
          </div>
        </div>

        {/* Stats Grid: Responsive columns, LARGE font size for numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-center">
          {/* Stat Block: Problems All Time */}
          <div className="p-3 bg-background dark:bg-neutral-700/60 rounded-lg">
            {/* Keep text-3xl across all sizes */}
            <p className="text-3xl font-bold text-primary dark:text-dark-purple">
              {problemsSolvedAllTime}
            </p>
            {/* Keep descriptive text small */}
            <p className="text-sm text-muted-foreground mt-1">
              Problems Solved (All Time)
            </p>
          </div>

          {/* Stat Block: Problems Last Year */}
          <div className="p-3 bg-background dark:bg-neutral-700/60 rounded-lg">
            <p className="text-3xl font-bold text-primary dark:text-dark-purple">
              {problemsSolvedLastYear}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Problems Solved (Last Year)
            </p>
          </div>

          {/* Stat Block: Problems Last Month */}
          <div className="p-3 bg-background dark:bg-neutral-700/60 rounded-lg">
            <p className="text-3xl font-bold text-primary dark:text-dark-purple">
              {problemsSolvedLastMonth}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Problems Solved (Last Month)
            </p>
          </div>

          {/* Stat Block: Max Streak All Time */}
          <div className="p-3 bg-background dark:bg-neutral-700/60 rounded-lg">
            <p className="text-3xl font-bold text-primary dark:text-dark-purple">
              {maxStreakAllTime}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Max Solving Streak (Days)
            </p>
          </div>

          {/* Stat Block: Max Streak Last Year */}
          <div className="p-3 bg-background dark:bg-neutral-700/60 rounded-lg">
            <p className="text-3xl font-bold text-primary dark:text-dark-purple">
              {maxStreakLastYear}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Max Streak (Last Year)
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Problem Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="p-4 sm:p-6 bg-card dark:bg-neutral-800/50 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-foreground dark:text-neutral-200">
            Problem Ratings Solved
          </h2>
          <ProblemRatingsBarChart data={problemRatingDistribution} />
        </section>
        <section className="p-4 sm:p-6 bg-card dark:bg-neutral-800/50 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-foreground dark:text-neutral-200">
            Tags Solved
          </h2>
          <TagsSolvedPieChart data={tagDistribution} />
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;
