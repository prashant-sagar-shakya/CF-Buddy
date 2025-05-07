import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CodeforcesProblem,
  CodeforcesSubmission,
  FilterOptions,
} from "@/types/codeforces";
import {
  getUniqueSolvedProblems,
  getUserSubmissions,
} from "@/services/codeforcesApi";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/UserContext";
import {
  Loader2,
  LinkIcon,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Tag, // Importing a generic tag icon might be nice
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SolvedStatus = "all" | "solved" | "unsolved";

interface SubmissionsListProps {
  handles: string[];
  filters: FilterOptions;
  setAvailableTags: React.Dispatch<React.SetStateAction<string[]>>;
}

interface ConsolidatedProblemEntry {
  problemId: string;
  problemDetails: CodeforcesProblem;
  solvedBy: Array<{
    handle: string;
    submissionId?: number;
    contestId?: number;
  }>;
}

const PROBLEMS_PER_PAGE = 30;
const INITIAL_DISPLAY_LIMIT = 2;
const INITIAL_TAG_LIMIT = 2; // How many tags to show initially

const SubmissionsList: React.FC<SubmissionsListProps> = ({
  handles,
  filters,
  setAvailableTags,
}) => {
  // --- State Declarations ---
  const [isLoading, setIsLoading] = useState(false);
  const [submissionsData, setSubmissionsData] = useState<
    Record<string, CodeforcesSubmission[]>
  >({});
  const [problemsData, setProblemsData] = useState<
    Record<string, CodeforcesProblem[]>
  >({});
  const [
    incorrectSubmissionsForCurrentUser,
    setIncorrectSubmissionsForCurrentUser,
  ] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { userState } = useUserContext();
  const [solvedProblemsByCurrentUser, setSolvedProblemsByCurrentUser] =
    useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [solvedStatusFilter, setSolvedStatusFilter] =
    useState<SolvedStatus>("all");
  const [expandedSolvedBy, setExpandedSolvedBy] = useState<Set<string>>(
    new Set()
  );
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(
    new Set()
  );
  // New state for expanded tags
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  // --- Effects ---

  // Reset state on filter/handle changes
  useEffect(() => {
    setCurrentPage(1);
    setSolvedStatusFilter("all");
    setExpandedSolvedBy(new Set());
    setExpandedSubmissions(new Set());
    setExpandedTags(new Set()); // Reset tag expansion
  }, [filters, handles]);

  // Reset expansion states on page change
  useEffect(() => {
    setExpandedSolvedBy(new Set());
    setExpandedSubmissions(new Set());
    setExpandedTags(new Set()); // Reset tag expansion
  }, [currentPage]);

  // Fetch data
  useEffect(() => {
    const fetchAllData = async () => {
      /* ... (fetch data logic - no change needed here) ... */
      if (handles.length === 0) {
        setProblemsData({});
        setSubmissionsData({});
        setAvailableTags([]);
        setSolvedProblemsByCurrentUser(new Set());
        setIncorrectSubmissionsForCurrentUser(new Set());
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const fetchPromises = handles.map(async (handle) => {
        try {
          const userSubmissions = await getUserSubmissions(handle);
          const acceptedUserSubmissions = userSubmissions.filter(
            (sub) => sub.verdict === "OK"
          );
          const uniqueProblems = getUniqueSolvedProblems(
            acceptedUserSubmissions
          );
          const tagsFromUser = new Set<string>();
          uniqueProblems.forEach((problem) =>
            problem.tags?.forEach((tag) => tagsFromUser.add(tag))
          );
          const incorrectSubmissionsSet = new Set<string>();
          if (handle === userState.currentUser) {
            userSubmissions.forEach((submission) => {
              if (submission.verdict !== "OK" && submission.problem.contestId) {
                incorrectSubmissionsSet.add(
                  `${submission.problem.contestId}-${submission.problem.index}`
                );
              }
            });
          }
          return {
            handle,
            submissions: userSubmissions,
            problems: uniqueProblems,
            tags: Array.from(tagsFromUser),
            incorrectSubmissionsForThisHandle: incorrectSubmissionsSet,
            error: null,
          };
        } catch (error) {
          console.error(`Error fetching data for ${handle}:`, error);
          toast({
            title: `Error fetching for ${handle}`,
            description: `Could not fetch data. See console.`,
            variant: "destructive",
          });
          return {
            handle,
            submissions: [],
            problems: [],
            tags: [],
            incorrectSubmissionsForThisHandle: new Set<string>(),
            error: error,
          };
        }
      });
      try {
        const results = await Promise.all(fetchPromises);
        const newSubmissionsLocal: Record<string, CodeforcesSubmission[]> = {};
        const newProblemsLocal: Record<string, CodeforcesProblem[]> = {};
        const allTags = new Set<string>();
        const finalIncorrectSetForCurrentUser = new Set<string>();
        results.forEach((result) => {
          newSubmissionsLocal[result.handle] = result.submissions;
          newProblemsLocal[result.handle] = result.problems;
          result.tags.forEach((tag) => allTags.add(tag));
          if (result.handle === userState.currentUser && !result.error) {
            result.incorrectSubmissionsForThisHandle.forEach((probKey) =>
              finalIncorrectSetForCurrentUser.add(probKey)
            );
          }
        });
        setSubmissionsData(newSubmissionsLocal);
        setProblemsData(newProblemsLocal);
        setAvailableTags(Array.from(allTags).sort());
        setIncorrectSubmissionsForCurrentUser(finalIncorrectSetForCurrentUser);
      } catch (overallError) {
        console.error("Overall error processing fetched data:", overallError);
        toast({
          title: "Error",
          description: "Failed to process some data. See console.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [handles, toast, setAvailableTags, userState.currentUser]);

  // Update solved problems for current user
  useEffect(() => {
    /* ... (no change needed here) ... */
    const currentUser = userState.currentUser;
    if (currentUser && problemsData[currentUser]) {
      const problemSet = new Set<string>();
      problemsData[currentUser].forEach((problem) => {
        if (problem.contestId !== undefined && problem.index) {
          problemSet.add(`${problem.contestId}-${problem.index}`);
        }
      });
      setSolvedProblemsByCurrentUser(problemSet);
    } else {
      setSolvedProblemsByCurrentUser(new Set());
    }
  }, [userState.currentUser, problemsData]);

  // --- Callbacks for Toggling Expansion ---
  const toggleSolvedByExpansion = useCallback((problemId: string) => {
    setExpandedSolvedBy((prev) => {
      const next = new Set(prev);
      if (next.has(problemId)) {
        next.delete(problemId);
      } else {
        next.add(problemId);
      }
      return next;
    });
  }, []);

  const toggleSubmissionsExpansion = useCallback((problemId: string) => {
    setExpandedSubmissions((prev) => {
      const next = new Set(prev);
      if (next.has(problemId)) {
        next.delete(problemId);
      } else {
        next.add(problemId);
      }
      return next;
    });
  }, []);

  // New callback for tags
  const toggleTagsExpansion = useCallback((problemId: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(problemId)) {
        next.delete(problemId);
      } else {
        next.add(problemId);
      }
      return next;
    });
  }, []);

  // --- Memoized Data Processing ---
  const consolidatedProblems = useMemo((): ConsolidatedProblemEntry[] => {
    /* ... (no change needed here) ... */
    const problemMap = new Map<string, ConsolidatedProblemEntry>();
    handles.forEach((handle) => {
      const userProblems = problemsData[handle] || [];
      const userSubmissions = submissionsData[handle] || [];
      userProblems.forEach((problem) => {
        if (problem.contestId === undefined || !problem.index) return;
        const problemId = `${problem.contestId}-${problem.index}`;
        const acceptedSubmission = userSubmissions.find(
          (sub) =>
            sub.problem.contestId === problem.contestId &&
            sub.problem.index === problem.index &&
            sub.verdict === "OK"
        );
        if (!problemMap.has(problemId)) {
          problemMap.set(problemId, {
            problemId: problemId,
            problemDetails: problem,
            solvedBy: [
              {
                handle,
                submissionId: acceptedSubmission?.id,
                contestId: acceptedSubmission?.contestId,
              },
            ],
          });
        } else {
          const existingEntry = problemMap.get(problemId)!;
          if (!existingEntry.solvedBy.some((s) => s.handle === handle)) {
            existingEntry.solvedBy.push({
              handle,
              submissionId: acceptedSubmission?.id,
              contestId: acceptedSubmission?.contestId,
            });
          }
        }
      });
    });
    return Array.from(problemMap.values());
  }, [handles, problemsData, submissionsData]);

  const filteredAndSortedProblems = useMemo(() => {
    /* ... (no change needed here) ... */
    const currentUserHandle = userState.currentUser;
    return consolidatedProblems
      .filter((entry) => {
        const { problemDetails, problemId } = entry;
        if (
          problemDetails.rating === undefined ||
          problemDetails.rating === null
        )
          return false;
        if (
          problemDetails.rating < filters.minRating ||
          problemDetails.rating > filters.maxRating
        )
          return false;
        if (filters.tags.length > 0) {
          if (
            !problemDetails.tags ||
            !filters.tags.some((tag) => problemDetails.tags.includes(tag))
          ) {
            return false;
          }
        }
        if (currentUserHandle && solvedStatusFilter !== "all") {
          const isSolvedByMain = solvedProblemsByCurrentUser.has(problemId);
          if (solvedStatusFilter === "solved" && !isSolvedByMain) return false;
          if (solvedStatusFilter === "unsolved" && isSolvedByMain) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          (a.problemDetails.rating || 0) - (b.problemDetails.rating || 0)
      );
  }, [
    consolidatedProblems,
    filters,
    solvedStatusFilter,
    userState.currentUser,
    solvedProblemsByCurrentUser,
  ]);

  // --- Pagination Logic ---
  const totalProblemsCount = filteredAndSortedProblems.length;
  const totalPages = Math.ceil(totalProblemsCount / PROBLEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE;
  const endIndex = startIndex + PROBLEMS_PER_PAGE;
  const paginatedProblems = filteredAndSortedProblems.slice(
    startIndex,
    endIndex
  );

  // --- Helper Functions ---
  const getRatingClass = (rating: number | undefined): string => {
    /* ... (no change needed here) ... */
    if (rating === undefined || rating === null)
      return "text-gray-500 dark:text-gray-400";
    if (rating >= 3000) return "text-cf-legendary dark:text-cf-legendary-dark";
    if (rating >= 2600) return "text-cf-red dark:text-cf-red-dark";
    if (rating >= 2400) return "text-cf-red dark:text-cf-red-dark";
    if (rating >= 2300) return "text-cf-orange dark:text-cf-orange-dark";
    if (rating >= 2100) return "text-cf-orange dark:text-cf-orange-dark";
    if (rating >= 1900) return "text-cf-violet dark:text-cf-violet-dark";
    if (rating >= 1600) return "text-cf-blue dark:text-cf-blue-dark";
    if (rating >= 1400) return "text-cf-cyan dark:text-cf-cyan-dark";
    if (rating >= 1200) return "text-cf-green dark:text-cf-green-dark";
    return "text-cf-gray dark:text-cf-gray-dark";
  };

  // --- Render Logic ---
  if (handles.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>Add Codeforces handles to view problems</p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-dark-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h2 className="text-lg font-semibold text-foreground text-white">
          Problems Count: {totalProblemsCount}
        </h2>
        {userState.currentUser /* ... (Solved/Unsolved Filter Buttons - no change needed) ... */ && (
          <div className="flex items-center gap-2">
            <Button
              variant={solvedStatusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSolvedStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              All
            </Button>
            <Button
              data-state={
                solvedStatusFilter === "solved" ? "active" : "inactive"
              }
              variant={solvedStatusFilter === "solved" ? "default" : "outline"}
              size="sm"
              className="bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20 dark:bg-dark-green/20 dark:text-dark-green dark:border-dark-green/30 dark:hover:bg-dark-green/30 data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-dark-green dark:data-[state=active]:text-white"
              onClick={() => {
                setSolvedStatusFilter("solved");
                setCurrentPage(1);
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Solved
            </Button>
            <Button
              data-state={
                solvedStatusFilter === "unsolved" ? "active" : "inactive"
              }
              variant={
                solvedStatusFilter === "unsolved" ? "default" : "outline"
              }
              size="sm"
              className="bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20 dark:bg-dark-red/20 dark:text-dark-red dark:border-dark-red/30 dark:hover:bg-dark-red/30 data-[state=active]:bg-red-600 data-[state=active]:text-white dark:data-[state=active]:bg-dark-red dark:data-[state=active]:text-white"
              onClick={() => {
                setSolvedStatusFilter("unsolved");
                setCurrentPage(1);
              }}
            >
              <XCircle className="mr-2 h-4 w-4" /> Unsolved
            </Button>
          </div>
        )}
      </div>

      {paginatedProblems.length > 0 ? (
        <>
          <div className="glass-card rounded-lg border dark:border-dark-blue/30">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-b-gray-200 dark:border-dark-blue">
                  <TableHead className="text-foreground w-[30%] xl:w-[25%]">
                    Problem
                  </TableHead>
                  <TableHead className="text-foreground w-[10%]">
                    Rating
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-foreground w-[20%]">
                    Tags
                  </TableHead>
                  <TableHead className="text-foreground w-[20%]">
                    Solved By
                  </TableHead>
                  <TableHead className="text-foreground w-[20%]">
                    Submissions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProblems.map((entry) => {
                  const { problemId, problemDetails, solvedBy } = entry;
                  const problemTags = problemDetails.tags || []; // Ensure tags is an array
                  const isSolvedByMainUser =
                    solvedProblemsByCurrentUser.has(problemId);
                  const hasIncorrectByMainUser =
                    incorrectSubmissionsForCurrentUser.has(problemId);
                  const isSolvedByExpanded = expandedSolvedBy.has(problemId);
                  const isSubmissionsExpanded =
                    expandedSubmissions.has(problemId);
                  // Check if tags for this row are expanded
                  const areTagsExpanded = expandedTags.has(problemId);

                  return (
                    <TableRow
                      key={problemId}
                      className={`border-b-gray-200/30 dark:border-dark-blue/30 transition-colors ${
                        isSolvedByMainUser
                          ? "bg-green-300 dark:bg-dark-green/40 hover:bg-green-400 dark:hover:bg-dark-green/30"
                          : hasIncorrectByMainUser && userState.currentUser
                          ? "bg-red-300 dark:bg-dark-red/40 hover:bg-red-400 dark:hover:bg-dark-red/30"
                          : "hover:bg-muted/50 dark:hover:bg-dark-blue/10"
                      }`}
                    >
                      {/* Problem Cell */}
                      <TableCell className="py-2 pr-1">
                        <a
                          href={`https://codeforces.com/problemset/problem/${problemDetails.contestId}/${problemDetails.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary problem-link font-medium block truncate"
                          title={`${problemDetails.name} (${problemDetails.contestId}${problemDetails.index})`}
                        >
                          {problemDetails.name} ({problemDetails.contestId}
                          {problemDetails.index})
                        </a>
                      </TableCell>
                      {/* Rating Cell */}
                      <TableCell
                        className={`py-2 pr-1 ${getRatingClass(
                          problemDetails.rating
                        )}`}
                      >
                        {problemDetails.rating}
                      </TableCell>

                      {/* --- MODIFIED TAGS CELL --- */}
                      <TableCell className="hidden md:table-cell py-2 pr-1">
                        <div className="flex flex-wrap items-start gap-1 max-w-[150px] lg:max-w-xs">
                          {" "}
                          {/* Use items-start */}
                          {/* Conditionally render slice or full list */}
                          {(areTagsExpanded
                            ? problemTags
                            : problemTags.slice(0, INITIAL_TAG_LIMIT)
                          ).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs truncate px-1.5 py-0.5"
                              title={tag}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {/* Show expand/collapse button if needed */}
                          {problemTags.length > INITIAL_TAG_LIMIT && (
                            <button
                              onClick={() => toggleTagsExpansion(problemId)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center h-[20px] px-1"
                            >
                              {" "}
                              {/* Adjusted style */}
                              {areTagsExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                              (
                              {areTagsExpanded
                                ? "less"
                                : `+${problemTags.length - INITIAL_TAG_LIMIT}`}
                              )
                            </button>
                          )}
                        </div>
                      </TableCell>
                      {/* --- END MODIFIED TAGS CELL --- */}

                      {/* Solved By Cell - Expandable */}
                      <TableCell className="py-2 pr-1">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {(isSolvedByExpanded
                            ? solvedBy
                            : solvedBy.slice(0, INITIAL_DISPLAY_LIMIT)
                          ).map((solver) => (
                            <span
                              key={solver.handle}
                              className={`block truncate ${
                                solver.handle === userState.currentUser
                                  ? "font-semibold text-primary dark:text-dark-purple"
                                  : ""
                              }`}
                              title={solver.handle}
                            >
                              {" "}
                              {solver.handle}{" "}
                            </span>
                          ))}
                          {solvedBy.length > INITIAL_DISPLAY_LIMIT && (
                            <button
                              onClick={() => toggleSolvedByExpansion(problemId)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs text-left flex items-center mt-1"
                            >
                              {isSolvedByExpanded ? (
                                <ChevronUp size={14} className="mr-1" />
                              ) : (
                                <ChevronDown size={14} className="mr-1" />
                              )}
                              {isSolvedByExpanded
                                ? "Show less"
                                : `Show ${
                                    solvedBy.length - INITIAL_DISPLAY_LIMIT
                                  } more`}
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Submissions Cell - Expandable */}
                      <TableCell className="py-2 pr-1">
                        <div className="flex flex-col gap-0.5">
                          {(isSubmissionsExpanded
                            ? solvedBy
                            : solvedBy.slice(0, INITIAL_DISPLAY_LIMIT)
                          ).map((solver) =>
                            solver.submissionId && solver.contestId ? (
                              <a
                                key={`${solver.handle}-${solver.submissionId}`}
                                href={`https://codeforces.com/contest/${solver.contestId}/submission/${solver.submissionId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 truncate"
                                title={`View ${solver.handle}'s submission`}
                              >
                                <LinkIcon size={12} />{" "}
                                <span className="truncate">
                                  {solver.handle}
                                </span>
                              </a>
                            ) : null
                          )}
                          {solvedBy.length > INITIAL_DISPLAY_LIMIT && (
                            <button
                              onClick={() =>
                                toggleSubmissionsExpansion(problemId)
                              }
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs text-left flex items-center mt-1"
                            >
                              {isSubmissionsExpanded ? (
                                <ChevronUp size={14} className="mr-1" />
                              ) : (
                                <ChevronDown size={14} className="mr-1" />
                              )}
                              {isSubmissionsExpanded
                                ? "Show less"
                                : `Show ${
                                    solvedBy.length - INITIAL_DISPLAY_LIMIT
                                  } more links`}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Buttons */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-2 border-t dark:border-dark-blue/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(currentPage - 1);
                }}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(currentPage + 1);
                }}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 border border-border rounded-md bg-card">
          <p className="text-muted-foreground">
            No problems match the current filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubmissionsList;
