// src/types/codeforces.ts

export interface CodeforcesUser {
  handle: string;
  email?: string;
  vkId?: string;
  openId?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank?: string; // Made optional as some API responses might not include it
  rating?: number; // Made optional as some API responses might not include it for unrated users
  maxRank?: string; // Made optional
  maxRating?: number; // Made optional
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount?: number; // Made optional
  avatar: string;
  titlePhoto: string;
}

export interface CodeforcesProblem {
  contestId?: number;
  index?: string;
  name?: string; // Name will be localized based on API call
  type?: "PROGRAMMING" | "QUESTION";
  points?: number;
  rating?: number;
  tags: string[]; // Ensured this is always an array by API processing
}

export interface CodeforcesSubmissionAuthorMember {
  handle: string;
}

export interface CodeforcesSubmissionAuthor {
  contestId?: number;
  members: CodeforcesSubmissionAuthorMember[];
  participantType:
    | "CONTESTANT"
    | "PRACTICE"
    | "VIRTUAL"
    | "MANAGER"
    | "OUT_OF_COMPETITION";
  ghost: boolean;
  room?: number;
  startTimeSeconds?: number;
}

export interface CodeforcesSubmission {
  id: number;
  contestId?: number; // Often present
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CodeforcesProblem; // This problem object's name will be localized
  author: CodeforcesSubmissionAuthor;
  programmingLanguage: string;
  verdict?:
    | "FAILED"
    | "OK"
    | "PARTIAL"
    | "COMPILATION_ERROR"
    | "RUNTIME_ERROR"
    | "WRONG_ANSWER"
    | "PRESENTATION_ERROR"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "IDLENESS_LIMIT_EXCEEDED"
    | "SECURITY_VIOLATED"
    | "CRASHED"
    | "INPUT_PREPARATION_CRASHED"
    | "CHALLENGED"
    | "SKIPPED"
    | "TESTING"
    | "REJECTED";
  testset?: // Added ? as it might not always be present or relevant
  | "SAMPLES"
    | "PRETESTS"
    | "TESTS"
    | "CHALLENGES"
    | "TESTS1"
    | "TESTS2"
    | "TESTS3"
    | "TESTS4" // Extend as necessary based on observations
    | "TESTS5"
    | "TESTS6"
    | "TESTS7"
    | "TESTS8"
    | "TESTS9"
    | "TESTS10";
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
  points?: number;
}

export interface FilterOptions {
  // Used by SubmissionsList
  minRating: number;
  maxRating: number;
  tags: string[];
}

// New type for the data from user.rating API endpoint
export interface CodeforcesRatingChange {
  contestId: number;
  contestName: string; // Name will be localized based on API call
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface UserState {
  currentUser: string | null;
  trackedUsers: string[];
}
