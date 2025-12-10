import React, { useEffect, useState } from "react";
import { useUserContext } from "@/context/UserContext";
import {
  getUserSubmissions,
  getUniqueSolvedProblems,
  getUserRatingHistory,
} from "@/services/codeforcesApi";
import {
  processRatingHistory,
  processSubmissionsForAnalytics,
  OverallAnalyticsData,
  ActivityPoint,
} from "@/services/analyticsHelpers";
import { generateAnalyticsReport } from "@/services/geminiService";
import ReactMarkdown from "react-markdown";
import { Loader2, Sparkles, BrainCircuit, Bot } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import RatingHistoryChart from "@/components/charts/RatingHistoryChart";
import ActivityHeatmapChart from "@/components/charts/ActivityHeatmapChart";
import ProblemRatingsBarChart from "@/components/charts/ProblemRatingsBarChart";
import TagsSolvedPieChart from "@/components/charts/TagsSolvedPieChart";
import HolographicCard from "@/components/ui/HolographicCard";
import NeonButton from "@/components/ui/NeonButton";

interface AnalyticsPageProps {
  handleProp?: string;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ handleProp }) => {
  const { userState } = useUserContext();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] =
    useState<OverallAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Report State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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
        const [submissions, ratingHistoryChanges] = await Promise.all([
          getUserSubmissions(targetHandle),
          getUserRatingHistory(targetHandle),
        ]);

        const uniqueSolved = getUniqueSolvedProblems(
          submissions.filter((s) => s.verdict === "OK")
        );

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

  const handleGenerateReport = async () => {
    if (!analyticsData || !userState.currentUser) return;

    setIsGeneratingReport(true);
    try {
      // We need the user object. Since we only have the handle in props/context,
      // we might need to fetch the full user object or pass it if available.
      // For now, we'll assume we can get it or construct a partial one,
      // BUT ideally, we should have fetched it in fetchData.
      // Let's re-fetch user info quickly or use what we have.
      // Actually, we can just use the handle and rating from analyticsData if available,
      // but generateAnalyticsReport expects a CodeforcesUser.
      // Let's fetch the user info inside here to be safe.
      const { getUserInfo } = await import("@/services/codeforcesApi");
      const user = await getUserInfo(targetHandle);
      const submissions = await getUserSubmissions(targetHandle); // Re-fetching might be redundant, but ensures fresh data for AI

      const report = await generateAnalyticsReport(user, submissions);
      setAiReport(report);
      toast({
        title: "AI Report Generated",
        description: "Your personalized insights are ready.",
      });
    } catch (err) {
      console.error("AI Generation Error:", err);
      toast({
        title: "Generation Failed",
        description: "Could not generate AI report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-xl font-display text-primary animate-pulse">
          ANALYZING DATA STREAMS...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500 font-mono">{error}</div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-10 text-muted-foreground font-mono">
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
    currentStreak,
    problemRatingDistribution,
    tagDistribution,
  } = analyticsData;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8 space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          ANALYTICS <span className="text-primary">//</span>{" "}
          <span className="text-secondary">{targetHandle?.toUpperCase()}</span>
        </h1>
        <NeonButton
          variant="accent"
          className="flex items-center gap-2"
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
        >
          {isGeneratingReport ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          {isGeneratingReport ? "ANALYZING..." : "GENERATE REPORT"}
        </NeonButton>
      </div>

      {/* AI Insights Section */}
      <HolographicCard className="border-primary/30 bg-primary/5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/20">
            <BrainCircuit className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              AI COMPANION INSIGHTS
              {aiReport && (
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  GENERATED
                </span>
              )}
            </h2>
            <div className="text-sm font-mono text-gray-300 leading-relaxed prose prose-invert max-w-none">
              {aiReport ? (
                <ReactMarkdown>{aiReport}</ReactMarkdown>
              ) : (
                <div className="flex flex-col gap-2 opacity-70">
                  <p>
                    Ready to analyze your performance data. Click{" "}
                    <span className="text-primary font-bold">
                      GENERATE REPORT
                    </span>{" "}
                    to receive personalized coaching insights powered by Gemini
                    AI.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    * Analysis includes rating trends, submission history, and
                    problem tags.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </HolographicCard>

      <HolographicCard>
        <h2 className="text-2xl font-display font-bold mb-6 text-white border-b border-white/10 pb-2">
          RATING HISTORY
        </h2>
        <RatingHistoryChart data={ratingHistory} handle={targetHandle!} />
      </HolographicCard>

      <HolographicCard>
        <h2 className="text-2xl font-display font-bold mb-6 text-white border-b border-white/10 pb-2">
          ACTIVITY HEATMAP
        </h2>

        <div className="heatmap-scroll-container mb-6 lg:mb-8 p-2 rounded-lg overflow-x-auto scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
          <style>{`
        .heatmap-scroll-container::-webkit-scrollbar { height: 6px; }
        .heatmap-scroll-container::-webkit-scrollbar-thumb { background-color: var(--scrollbar-thumb-color, #A855F7); border-radius: 3px; }
        .heatmap-scroll-container::-webkit-scrollbar-track { background: transparent; }
     `}</style>
          <div className="min-w-[600px] sm:min-w-[700px]">
            <ActivityHeatmapChart data={activityHeatmap as ActivityPoint[]} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            { label: "Solved (All Time)", value: problemsSolvedAllTime },
            { label: "Solved (Year)", value: problemsSolvedLastYear },
            { label: "Solved (Month)", value: problemsSolvedLastMonth },
            { label: "Max Streak", value: maxStreakAllTime },
            { label: "Year Streak", value: maxStreakLastYear },
            { label: "Current Streak", value: currentStreak },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 bg-black/40 rounded-lg border border-white/5 hover:border-primary/30 transition-colors"
            >
              <p className="text-3xl font-mono font-bold text-secondary text-glow">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </HolographicCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <HolographicCard>
          <h2 className="text-2xl font-display font-bold mb-6 text-white border-b border-white/10 pb-2">
            SOLVED BY RATING
          </h2>
          <ProblemRatingsBarChart data={problemRatingDistribution} />
        </HolographicCard>
        <HolographicCard>
          <h2 className="text-2xl font-display font-bold mb-6 text-white border-b border-white/10 pb-2">
            TAGS DISTRIBUTION
          </h2>
          <TagsSolvedPieChart data={tagDistribution} />
        </HolographicCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;
