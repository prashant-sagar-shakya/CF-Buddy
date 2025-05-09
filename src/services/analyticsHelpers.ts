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
  subDays,
} from "date-fns";

export interface ActivityPoint {
  date: string;
  count: number;
  level?: 0 | 1 | 2 | 3 | 4;
}

export interface RatingDataPoint {
  time: number;
  rating: number;
  contestName: string;
}

export interface ProblemStats {
  rating: number;
  count: number;
}

export interface TagStats {
  name: string;
  value: number;
}

export interface OverallAnalyticsData {
  ratingHistory: RatingDataPoint[];
  activityHeatmap: ActivityPoint[];
  problemsSolvedAllTime: number;
  problemsSolvedLastYear: number;
  problemsSolvedLastMonth: number;
  maxStreakAllTime: number;
  maxStreakLastYear: number;
  currentStreak: number;
  problemRatingDistribution: ProblemStats[];
  tagDistribution: TagStats[];
}

export const processRatingHistory = (
  ratingChanges: CodeforcesRatingChange[]
): RatingDataPoint[] => {
  if (!ratingChanges || ratingChanges.length === 0) {
    return [
      {
        time: Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60,
        rating: 1500,
        contestName: "Initial Rating",
      },
    ];
  }

  const processed: RatingDataPoint[] = [];

  if (ratingChanges[0].oldRating !== 0 && ratingChanges[0].oldRating !== 1500) {
    processed.push({
      time: ratingChanges[0].ratingUpdateTimeSeconds - 3600,
      rating: ratingChanges[0].oldRating,
      contestName: "Assumed Previous Rating",
    });
  } else if (ratingChanges[0].oldRating === 0) {
    processed.push({
      time: ratingChanges[0].ratingUpdateTimeSeconds - 3600,
      rating: 1500,
      contestName: "Initial Rating (Estimated)",
    });
  }

  ratingChanges.forEach((change, index) => {
    if (index === 0 && processed.length === 0 && change.oldRating !== 0) {
      processed.push({
        time: change.ratingUpdateTimeSeconds - 1,
        rating: change.oldRating,
        contestName: `Before: ${change.contestName}`,
      });
    } else if (
      index > 0 &&
      ratingChanges[index - 1].newRating !== change.oldRating
    ) {
      processed.push({
        time: change.ratingUpdateTimeSeconds - 1,
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

  if (
    processed.length === 0 &&
    ratingChanges.length > 0 &&
    ratingChanges[0].oldRating === 0
  ) {
    processed.push({
      time: ratingChanges[0].ratingUpdateTimeSeconds - 3600,
      rating: 1500,
      contestName: "Initial Rating (Estimated)",
    });
    processed.push({
      time: ratingChanges[0].ratingUpdateTimeSeconds,
      rating: ratingChanges[0].newRating,
      contestName: ratingChanges[0].contestName,
    });
  }

  if (processed.length === 0) {
    return [
      {
        time: Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60,
        rating: 1500,
        contestName: "Initial Rating",
      },
    ];
  }

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
  | "currentStreak"
  | "problemRatingDistribution"
  | "tagDistribution"
> => {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = startOfDay(subDays(now, 1));
  const oneYearAgo = startOfDay(subYears(now, 1));
  const oneMonthAgo = startOfDay(subMonths(now, 1));

  const acceptedSubmissions = submissions.filter((s) => s.verdict === "OK");

  const submissionDatesTimes = acceptedSubmissions.map((s) =>
    startOfDay(new Date(s.creationTimeSeconds * 1000)).getTime()
  );

  const uniqueSortedSolveDates = [...new Set(submissionDatesTimes)]
    .map((time) => new Date(time))
    .sort((a, b) => a.getTime() - b.getTime());

  const activityMap = new Map<string, number>();
  uniqueSortedSolveDates.forEach((date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const dailySubmissionsCount = acceptedSubmissions.filter((s) =>
      isSameDay(new Date(s.creationTimeSeconds * 1000), date)
    ).length;
    activityMap.set(dateString, dailySubmissionsCount);
  });

  const activityHeatmap: ActivityPoint[] = [];
  if (uniqueSortedSolveDates.length > 0) {
    const firstSolveDate = uniqueSortedSolveDates[0];
    const lastSolveDate =
      uniqueSortedSolveDates[uniqueSortedSolveDates.length - 1];

    const heatMapStartDateRef =
      firstSolveDate < oneYearAgo ? oneYearAgo : firstSolveDate;
    const heatMapStartDate = startOfDay(heatMapStartDateRef);
    const heatMapEndDate = startOfDay(
      lastSolveDate > today ? lastSolveDate : today
    );

    if (heatMapStartDate <= heatMapEndDate) {
      eachDayOfInterval({
        start: heatMapStartDate,
        end: heatMapEndDate,
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
  }

  const calculateMaxStreak = (dates: Date[]): number => {
    if (dates.length === 0) return 0;
    let maxStreak = 0;
    let currentStreak = 0;
    if (dates.length > 0) maxStreak = 1;

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else if (differenceInCalendarDays(dates[i], dates[i - 1]) === 1) {
        currentStreak++;
      } else if (differenceInCalendarDays(dates[i], dates[i - 1]) > 1) {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  };

  let currentStreak = 0;
  if (uniqueSortedSolveDates.length > 0) {
    const lastSolveDate =
      uniqueSortedSolveDates[uniqueSortedSolveDates.length - 1];
    if (
      isSameDay(lastSolveDate, today) ||
      isSameDay(lastSolveDate, yesterday)
    ) {
      currentStreak = 1;
      for (let i = uniqueSortedSolveDates.length - 2; i >= 0; i--) {
        const dayToCheck = uniqueSortedSolveDates[i];
        const previousDayInStreak = uniqueSortedSolveDates[i + 1];
        if (differenceInCalendarDays(previousDayInStreak, dayToCheck) === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  const problemsSolvedAllTime = uniqueSolvedProblems.length;

  const getSolveTimeForProblem = (
    problem: CodeforcesProblem
  ): number | null => {
    const solve = acceptedSubmissions.find(
      (s) =>
        s.problem.contestId === problem.contestId &&
        s.problem.index === problem.index
    );
    return solve ? solve.creationTimeSeconds * 1000 : null;
  };

  const problemsSolvedLastYear = uniqueSolvedProblems.filter((p) => {
    const solveTime = getSolveTimeForProblem(p);
    return solveTime !== null && startOfDay(new Date(solveTime)) >= oneYearAgo;
  }).length;

  const problemsSolvedLastMonth = uniqueSolvedProblems.filter((p) => {
    const solveTime = getSolveTimeForProblem(p);
    return solveTime !== null && startOfDay(new Date(solveTime)) >= oneMonthAgo;
  }).length;

  const maxStreakAllTime = calculateMaxStreak(uniqueSortedSolveDates);
  const maxStreakLastYear = calculateMaxStreak(
    uniqueSortedSolveDates.filter((d) => d >= oneYearAgo)
  );

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

  const tagCounts = new Map<string, number>();
  uniqueSolvedProblems.forEach((p) => {
    p.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const tagDistribution: TagStats[] = Array.from(tagCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    activityHeatmap,
    problemsSolvedAllTime,
    problemsSolvedLastYear,
    problemsSolvedLastMonth,
    maxStreakAllTime,
    maxStreakLastYear,
    currentStreak,
    problemRatingDistribution,
    tagDistribution,
  };
};