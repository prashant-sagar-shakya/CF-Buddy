// src/services/dppHelpers.ts
import { CodeforcesProblem, CodeforcesSubmission } from "@/types/codeforces";

// Define types for DPP problems with elite solver information
export interface EliteSolverInfo {
  handle: string;
  submissionId: number;
  contestId: number; // Problem's contestId
  problemIndex: string; // Problem's index
}

export interface DppProblemEntry extends CodeforcesProblem {
  solvedByElite?: EliteSolverInfo[];
}

export interface DPPLevel {
  level: number;
  name: string;
  ratingRange: { min: number; max: number };
  problemDistribution: Array<{ rating: number; count: number }>;
  totalQuestions: number;
  warmUp?: Array<{ rating: number; count: number }>;
}

export const ELITE_USERS_DPP = [
  "tourist",
  "jiangly",
  "orzdevinwang",
  "demoralizer",
  "Priyansh31dec",
];

export const DPP_LEVELS_CONFIG: DPPLevel[] = [
  // ... (Keep all your DPP_LEVELS_CONFIG levels as they were)
  {
    level: 1,
    name: "Level 1 Newbie",
    ratingRange: { min: 800, max: 1100 },
    problemDistribution: [
      { rating: 800, count: 3 },
      { rating: 900, count: 3 },
      { rating: 1000, count: 2 },
      { rating: 1100, count: 2 },
    ],
    totalQuestions: 10,
  },
  {
    level: 2,
    name: "Level 2 Pupil",
    ratingRange: { min: 1200, max: 1300 },
    problemDistribution: [
      { rating: 1200, count: 4 },
      { rating: 1300, count: 3 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 900, count: 1 },
      { rating: 1000, count: 1 },
      { rating: 1100, count: 1 },
    ],
  },
  {
    level: 3,
    name: "Level 3 Specialist",
    ratingRange: { min: 1400, max: 1500 },
    problemDistribution: [
      { rating: 1400, count: 4 },
      { rating: 1500, count: 3 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 1100, count: 1 },
      { rating: 1200, count: 1 },
      { rating: 1300, count: 1 },
    ],
  },
  {
    level: 4,
    name: "Level 4 Expert",
    ratingRange: { min: 1600, max: 1700 },
    problemDistribution: [
      { rating: 1600, count: 4 },
      { rating: 1700, count: 3 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 1300, count: 1 },
      { rating: 1400, count: 1 },
      { rating: 1500, count: 1 },
    ],
  },
  {
    level: 5,
    name: "Level 5 Candidate Master",
    ratingRange: { min: 1800, max: 1900 },
    problemDistribution: [
      { rating: 1800, count: 4 },
      { rating: 1900, count: 3 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 1500, count: 1 },
      { rating: 1600, count: 1 },
      { rating: 1700, count: 1 },
    ],
  },
  {
    level: 6,
    name: "Level 6 Master",
    ratingRange: { min: 2000, max: 2100 },
    problemDistribution: [
      { rating: 2000, count: 4 },
      { rating: 2100, count: 3 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 1700, count: 1 },
      { rating: 1800, count: 1 },
      { rating: 1900, count: 1 },
    ],
  },
  {
    level: 7,
    name: "Level 7 International Master",
    ratingRange: { min: 2200, max: 2300 },
    problemDistribution: [
      { rating: 2200, count: 4 },
      { rating: 2300, count: 3 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 1900, count: 1 },
      { rating: 2000, count: 1 },
      { rating: 2100, count: 1 },
    ],
  },
  {
    level: 8,
    name: "Level 8 Grandmaster",
    ratingRange: { min: 2400, max: 2500 },
    problemDistribution: [
      { rating: 2400, count: 4 },
      { rating: 2500, count: 3 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 2100, count: 1 },
      { rating: 2200, count: 1 },
      { rating: 2300, count: 1 },
    ],
  },
  {
    level: 9,
    name: "Level 9 International Grandmaster",
    ratingRange: { min: 2600, max: 2800 },
    problemDistribution: [
      { rating: 2600, count: 3 },
      { rating: 2700, count: 2 },
      { rating: 2800, count: 2 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 2300, count: 1 },
      { rating: 2400, count: 1 },
      { rating: 2500, count: 1 },
    ],
  },
  {
    level: 10,
    name: "Level 10 Legendary Grandmaster",
    ratingRange: { min: 2900, max: 3500 },
    problemDistribution: [
      { rating: 2900, count: 1 },
      { rating: 3000, count: 1 },
      { rating: 3100, count: 1 },
      { rating: 3200, count: 1 },
      { rating: 3300, count: 1 },
      { rating: 3400, count: 1 },
      { rating: 3500, count: 1 },
    ],
    totalQuestions: 7,
    warmUp: [
      { rating: 2600, count: 1 },
      { rating: 2700, count: 1 },
      { rating: 2800, count: 1 },
    ],
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const processEliteUserSubmissions = (
  eliteUsersSubmissionsData: {
    handle: string;
    submissions: CodeforcesSubmission[];
  }[]
): Map<string, EliteSolverInfo[]> => {
  const problemToEliteSolversMap = new Map<string, EliteSolverInfo[]>();

  for (const userData of eliteUsersSubmissionsData) {
    const { handle, submissions } = userData;
    if (!submissions) continue;

    for (const sub of submissions) {
      if (sub.verdict === "OK" && sub.problem.contestId && sub.problem.index) {
        const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;

        const solverInfo: EliteSolverInfo = {
          handle: handle,
          submissionId: sub.id,
          contestId: sub.problem.contestId,
          problemIndex: sub.problem.index,
        };

        if (!problemToEliteSolversMap.has(problemKey)) {
          problemToEliteSolversMap.set(problemKey, []);
        }

        const existingSolversForProblem =
          problemToEliteSolversMap.get(problemKey)!;
        if (!existingSolversForProblem.find((s) => s.handle === handle)) {
          existingSolversForProblem.push(solverInfo);
        }
      }
    }
  }
  return problemToEliteSolversMap;
};

export const generateDppSet = (
  levelConfig: DPPLevel,
  allProblems: CodeforcesProblem[],
  solvedProblemKeysByCurrentUser: Set<string>,
  eliteUserSolutionsForProblems: Map<string, EliteSolverInfo[]>
): {
  mainProblems: DppProblemEntry[];
  warmUpProblems: DppProblemEntry[];
} => {
  const mainProblems: DppProblemEntry[] = [];
  const warmUpProblems: DppProblemEntry[] = [];
  const pickedProblemKeys = new Set<string>();

  const pickProblems = (
    distribution: Array<{ rating: number; count: number }>,
    targetArray: DppProblemEntry[]
  ) => {
    for (const group of distribution) {
      const candidates: DppProblemEntry[] = allProblems
        .filter((p) => {
          if (p.rating !== group.rating) return false;
          if (p.contestId === undefined || p.index === undefined) return false;

          const problemKey = `${p.contestId}-${p.index}`;

          // *** MODIFIED/STRICTER FILTER START ***
          const eliteSolutions = eliteUserSolutionsForProblems.get(problemKey);
          // Problem must be known to be solved by elites AND have a non-empty list of their solution info
          if (!eliteSolutions || eliteSolutions.length === 0) {
            return false;
          }
          // *** MODIFIED/STRICTER FILTER END ***

          if (solvedProblemKeysByCurrentUser.has(problemKey)) return false;
          if (pickedProblemKeys.has(problemKey)) return false;

          return true;
        })
        .map((p_candidate) => {
          // Renamed `p` to `p_candidate` to avoid confusion with outer scope `p` if any
          // problemKey and eliteSolutions are known to be valid and non-empty here from the filter
          const problemKey = `${p_candidate.contestId!}-${p_candidate.index!}`;
          const eliteSolutionsForThisProblem =
            eliteUserSolutionsForProblems.get(problemKey)!;
          return {
            ...p_candidate,
            solvedByElite: eliteSolutionsForThisProblem, // This should always be a non-empty array now
          };
        });

      const shuffledCandidates = shuffleArray(candidates);

      const problemsToPickCount = Math.min(
        shuffledCandidates.length,
        group.count
      );
      for (let i = 0; i < problemsToPickCount; i++) {
        const pickedProblem = shuffledCandidates[i];
        targetArray.push(pickedProblem);
        pickedProblemKeys.add(
          `${pickedProblem.contestId}-${pickedProblem.index}`
        );
      }
    }
  };

  pickProblems(levelConfig.problemDistribution, mainProblems);

  if (levelConfig.warmUp && levelConfig.warmUp.length > 0) {
    pickProblems(levelConfig.warmUp, warmUpProblems);
  }

  return { mainProblems, warmUpProblems };
};
