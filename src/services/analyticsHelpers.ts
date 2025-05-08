import {
  CodeforcesSubmission,
  CodeforcesProblem,
  CodeforcesRatingChange,
} from "@/types/codeforces";
import {
  format,
  subYears,
  subMonths,
  startOfDay,
  eachDayOfInterval,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";

// --- Types for Processed Analytics Data ---
export interface ActivityPoint {
  date: string; // YYYY-MM-DD
  count: number;
  level?: 0 | 1 | 2 | 3 | 4; // For heatmap coloring
}

export interface RatingDataPoint {
  time: number; // Timestamp in seconds
  rating: number;
  contestName: string;
}

export interface ProblemStats {
  rating: number;
  count: number;
}

export interface TagStats {
  name: string;
  value: number; // Count of problems with this tag
}

export interface OverallAnalyticsData {
  ratingHistory: RatingDataPoint[];
  activityHeatmap: ActivityPoint[];
  problemsSolvedAllTime: number;
  problemsSolvedLastYear: number;
  problemsSolvedLastMonth: number;
  maxStreakAllTime: number;
  maxStreakLastYear: number;
  // maxStreakLastMonth: number; // Can add if needed
  problemRatingDistribution: ProblemStats[];
  tagDistribution: TagStats[];
}

// --- Processing Functions ---

export const processRatingHistory = (
  ratingChanges: CodeforcesRatingChange[]
): RatingDataPoint[] => {
  if (!ratingChanges || ratingChanges.length === 0) return [];
  // Add an initial point if the first contest isn't the user's very first rating
  const processed: RatingDataPoint[] = [];
  if (
    ratingChanges.length > 0 &&
    ratingChanges[0].oldRating !== 0 &&
    ratingChanges[0].oldRating !== 1500
  ) {
    // Create a synthetic point slightly before the first contest if oldRating is not typical start
    processed.push({
      time: ratingChanges[0].ratingUpdateTimeSeconds - 3600, // An hour before
      rating: ratingChanges[0].oldRating,
      contestName: "Initial Rating",
    });
  } else if (ratingChanges.length > 0 && ratingChanges[0].oldRating === 0) {
    // Common for very new users
    processed.push({
      time: ratingChanges[0].ratingUpdateTimeSeconds - 3600, // An hour before
      rating: 1500, // Assume 1500 before first rated contest if oldRating is 0
      contestName: "Initial Rating",
    });
  }

  ratingChanges.forEach((change) => {
    // It's common to show the old rating up until the point of the new contest
    // And then the new rating from that point onwards.
    // Some charts plot newRating at ratingUpdateTimeSeconds.
    if (processed.length === 0 && change.oldRating !== 0) {
      // Ensure an initial point
      processed.push({
        time: change.ratingUpdateTimeSeconds - 1, // A second before update
        rating: change.oldRating,
        contestName: `Before: ${change.contestName}`,
      });
    }
    processed.push({
      time: change.ratingUpdateTimeSeconds,
      rating: change.newRating,
      contestName: change.contestName,
    });
  });
  return processed.sort((a, b) => a.time - b.time);
};

export const processSubmissionsForAnalytics = (
  submissions: CodeforcesSubmission[],
  uniqueSolvedProblems: CodeforcesProblem[]
): Pick<
  OverallAnalyticsData,
  | "activityHeatmap"
  | "problemsSolvedAllTime"
  | "problemsSolvedLastYear"
  | "problemsSolvedLastMonth"
  | "maxStreakAllTime"
  | "maxStreakLastYear"
  | "problemRatingDistribution"
  | "tagDistribution"
> => {
  const now = new Date();
  const oneYearAgo = subYears(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  const acceptedSubmissions = submissions.filter((s) => s.verdict === "OK");

  // --- Activity Heatmap & Streaks ---
  const submissionDates = acceptedSubmissions
    .map((s) => startOfDay(new Date(s.creationTimeSeconds * 1000)))
    .sort((a, b) => a.getTime() - b.getTime());

  const activityMap = new Map<string, number>();
  submissionDates.forEach((date) => {
    const dateString = format(date, "yyyy-MM-dd");
    activityMap.set(dateString, (activityMap.get(dateString) || 0) + 1);
  });

  const activityHeatmap: ActivityPoint[] = [];
  if (submissionDates.length > 0) {
    const firstSubmissionDate = submissionDates[0];
    const lastSubmissionDate =
      submissionDates[submissionDates.length - 1] > now
        ? submissionDates[submissionDates.length - 1]
        : now; // Go up to today or last submission

    eachDayOfInterval({
      start: startOfDay(
        firstSubmissionDate < oneYearAgo ? oneYearAgo : firstSubmissionDate
      ),
      end: startOfDay(lastSubmissionDate),
    }).forEach((day) => {
      const dateString = format(day, "yyyy-MM-dd");
      const count = activityMap.get(dateString) || 0;
      let level: ActivityPoint["level"] = 0;
      if (count > 0) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;
      activityHeatmap.push({ date: dateString, count, level });
    });
  }

  const calculateMaxStreak = (dates: Date[]): number => {
    if (dates.length === 0) return 0;
    const uniqueSortedDates = [...new Set(dates.map((d) => d.getTime()))]
      .map((time) => new Date(time))
      .sort((a, b) => a.getTime() - b.getTime());

    let maxStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < uniqueSortedDates.length; i++) {
      if (
        i === 0 ||
        differenceInCalendarDays(
          uniqueSortedDates[i],
          uniqueSortedDates[i - 1]
        ) === 1
      ) {
        currentStreak++;
      } else if (
        differenceInCalendarDays(
          uniqueSortedDates[i],
          uniqueSortedDates[i - 1]
        ) > 1
      ) {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1; // Reset streak
      }
      // If dates are same day, streak continues without incrementing beyond 1 for that day's start
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  };

  const problemsSolvedAllTime = uniqueSolvedProblems.length;
  const problemsSolvedLastYear = uniqueSolvedProblems.filter((p) => {
    const sub = acceptedSubmissions.find(
      (s) => s.problem.contestId === p.contestId && s.problem.index === p.index
    );
    return sub && new Date(sub.creationTimeSeconds * 1000) >= oneYearAgo;
  }).length;
  const problemsSolvedLastMonth = uniqueSolvedProblems.filter((p) => {
    const sub = acceptedSubmissions.find(
      (s) => s.problem.contestId === p.contestId && s.problem.index === p.index
    );
    return sub && new Date(sub.creationTimeSeconds * 1000) >= oneMonthAgo;
  }).length;

  const maxStreakAllTime = calculateMaxStreak(submissionDates);
  const maxStreakLastYear = calculateMaxStreak(
    submissionDates.filter((d) => d >= oneYearAgo)
  );

  // --- Problem Rating Distribution ---
  const ratingCounts = new Map<number, number>();
  uniqueSolvedProblems.forEach((p) => {
    if (p.rating) {
      ratingCounts.set(p.rating, (ratingCounts.get(p.rating) || 0) + 1);
    }
  });
  const problemRatingDistribution: ProblemStats[] = Array.from(
    ratingCounts.entries()
  )
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  // --- Tag Distribution ---
  const tagCounts = new Map<string, number>();
  uniqueSolvedProblems.forEach((p) => {
    p.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const tagDistribution: TagStats[] = Array.from(tagCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort by count desc

  return {
    activityHeatmap,
    problemsSolvedAllTime,
    problemsSolvedLastYear,
    problemsSolvedLastMonth,
    maxStreakAllTime,
    maxStreakLastYear,
    problemRatingDistribution,
    tagDistribution,
  };
};
