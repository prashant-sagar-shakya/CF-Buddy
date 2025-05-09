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
  RefreshCw,
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

const PROBLEMS_PER_PAGE = 25;
const INITIAL_DISPLAY_LIMIT = 2;
const INITIAL_TAG_LIMIT = 2;

const getRatingClass = (rating: number | undefined): string => {
  if (rating === undefined || rating === null)
    return "text-gray-600 dark:text-gray-400";

  if (rating >= 3000) return "text-[#A80000] dark:text-[#780101]";
  if (rating >= 2600) return "text-[#E62E2E] dark:text-[#9d1f1f]";
  if (rating >= 2400) return "text-[#F06060] dark:text-[#914242]";
  if (rating >= 2300) return "text-[#EEA030] dark:text-[#a2691e]";
  if (rating >= 2100) return "text-[#E8B068] dark:text-[#99713d]";
  if (rating >= 1900) return "text-[#E566E5] dark:text-[#944f94]";
  if (rating >= 1600) return "text-[#8888EE] dark:text-[#4e4e7c]";
  if (rating >= 1400) return "text-[#55C0A0] dark:text-[#467f6c]";
  if (rating >= 1200) return "text-[#55D455] dark:text-[#3d893d]";

  return "text-[#A0A0A0] dark:text-[#a19d9d]";
};

const SubmissionsList: React.FC<SubmissionsListProps> = ({
  handles,
  filters,
  setAvailableTags,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [submissionsData, setSubmissionsData] = useState<
    Record<string, CodeforcesSubmission[]>
  >({});
  const [problemsData, setProblemsData] = useState<
    Record<string, CodeforcesProblem[]>
  >({});
  const [initialProblemCounts, setInitialProblemCounts] = useState<
    Record<string, number>
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
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(
    new Set()
  );
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCurrentPage(1);
    setExpandedSubmissions(new Set());
    setExpandedTags(new Set());
  }, [filters, handles]);

  useEffect(() => {
    setExpandedSubmissions(new Set());
    setExpandedTags(new Set());
  }, [currentPage]);

  const fetchAllData = useCallback(async () => {
    if (handles.length === 0) {
      setProblemsData({});
      setSubmissionsData({});
      setAvailableTags([]);
      setSolvedProblemsByCurrentUser(new Set());
      setIncorrectSubmissionsForCurrentUser(new Set());
      setInitialProblemCounts({});
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

        const incorrectSubmissionsSetForThisHandle = new Set<string>();
        if (handle === userState.currentUser) {
          const solvedProblemKeysForUser = new Set<string>();
          acceptedUserSubmissions.forEach((sub) => {
            if (sub.problem.contestId && sub.problem.index) {
              solvedProblemKeysForUser.add(
                `${sub.problem.contestId}-${sub.problem.index}`
              );
            }
          });

          userSubmissions.forEach((submission) => {
            if (submission.problem.contestId && submission.problem.index) {
              const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
              if (
                submission.verdict !== "OK" &&
                !solvedProblemKeysForUser.has(problemKey)
              ) {
                incorrectSubmissionsSetForThisHandle.add(problemKey);
              }
            }
          });
        }
        return {
          handle,
          submissions: userSubmissions,
          problems: uniqueProblems,
          tags: Array.from(tagsFromUser),
          incorrectSubmissionsForThisHandle:
            incorrectSubmissionsSetForThisHandle,
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
      const newInitialCounts: Record<string, number> = {};
      const allTags = new Set<string>();
      const finalIncorrectSetForCurrentUser = new Set<string>();

      results.forEach((result) => {
        newSubmissionsLocal[result.handle] = result.submissions;
        newProblemsLocal[result.handle] = result.problems;
        newInitialCounts[result.handle] = result.problems.length;
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
      setInitialProblemCounts(newInitialCounts);
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
  }, [
    handles,
    toast,
    setAvailableTags,
    userState.currentUser,
    setProblemsData,
    setSubmissionsData,
    setInitialProblemCounts,
    setIsLoading,
    setIncorrectSubmissionsForCurrentUser,
  ]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    setExpandedSubmissions(new Set());
    setExpandedTags(new Set());
    fetchAllData();
  }, [fetchAllData, setCurrentPage, setExpandedSubmissions, setExpandedTags]);

  useEffect(() => {
    const currentUser = userState.currentUser;
    if (currentUser && submissionsData[currentUser]) {
      const problemSet = new Set<string>();
      submissionsData[currentUser].forEach((submission) => {
        if (
          submission.verdict === "OK" &&
          submission.problem.contestId &&
          submission.problem.index
        ) {
          problemSet.add(
            `${submission.problem.contestId}-${submission.problem.index}`
          );
        }
      });
      setSolvedProblemsByCurrentUser(problemSet);
    } else {
      setSolvedProblemsByCurrentUser(new Set());
    }
  }, [userState.currentUser, submissionsData]);

  const toggleSubmissionsExpansion = useCallback((problemId: string) => {
    setExpandedSubmissions((prev) => {
      const next = new Set(prev);
      next.has(problemId) ? next.delete(problemId) : next.add(problemId);
      return next;
    });
  }, []);

  const toggleTagsExpansion = useCallback((problemId: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      next.has(problemId) ? next.delete(problemId) : next.add(problemId);
      return next;
    });
  }, []);

  const consolidatedProblems = useMemo((): ConsolidatedProblemEntry[] => {
    const problemMap = new Map<string, ConsolidatedProblemEntry>();
    handles.forEach((handle) => {
      const userUniqueSolvedProblems = problemsData[handle] || [];
      const allUserSubmissions = submissionsData[handle] || [];

      userUniqueSolvedProblems.forEach((problem) => {
        if (problem.contestId === undefined || !problem.index) return;
        const problemId = `${problem.contestId}-${problem.index}`;

        const acceptedSubmissionForThisProblemByThisHandle =
          allUserSubmissions.find(
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
                submissionId: acceptedSubmissionForThisProblemByThisHandle?.id,
                contestId:
                  acceptedSubmissionForThisProblemByThisHandle?.contestId,
              },
            ],
          });
        } else {
          const existingEntry = problemMap.get(problemId)!;
          if (!existingEntry.solvedBy.some((s) => s.handle === handle)) {
            existingEntry.solvedBy.push({
              handle,
              submissionId: acceptedSubmissionForThisProblemByThisHandle?.id,
              contestId:
                acceptedSubmissionForThisProblemByThisHandle?.contestId,
            });
          }
        }
      });
    });
    return Array.from(problemMap.values());
  }, [handles, problemsData, submissionsData]);

  const filteredAndSortedProblems = useMemo(() => {
    const currentUserHandle = userState.currentUser;
    return consolidatedProblems
      .filter((entry) => {
        const { problemDetails, problemId, solvedBy } = entry;

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

        const isSingleCurrentUserHandleView =
          currentUserHandle &&
          handles.length === 1 &&
          handles[0] === currentUserHandle;

        const otherSolversCount = solvedBy.filter(
          (solver) => solver.handle !== currentUserHandle
        ).length;

        if (!isSingleCurrentUserHandleView && otherSolversCount === 0) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) => {
          const pA = a.problemDetails;
          const pB = b.problemDetails;

          if (pA.rating! !== pB.rating!) {
            return pA.rating! - pB.rating!;
          }
          
          const contestIdA = typeof pA.contestId === 'number' ? pA.contestId : Number.MAX_SAFE_INTEGER;
          const contestIdB = typeof pB.contestId === 'number' ? pB.contestId : Number.MAX_SAFE_INTEGER;
          if (contestIdA !== contestIdB) {
            return contestIdA - contestIdB;
          }

          const indexA = pA.index ?? "";
          const indexB = pB.index ?? "";
          return indexA.localeCompare(indexB);
        }
      );
  }, [
    consolidatedProblems,
    filters,
    solvedStatusFilter,
    userState.currentUser,
    solvedProblemsByCurrentUser,
    handles,
  ]);

  const totalProblemsCount = filteredAndSortedProblems.length;
  const totalPages = Math.ceil(totalProblemsCount / PROBLEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE;
  const endIndex = startIndex + PROBLEMS_PER_PAGE;
  const paginatedProblems = filteredAndSortedProblems.slice(
    startIndex,
    endIndex
  );

  if (
    isLoading &&
    handles.length > 0 &&
    Object.keys(problemsData).length === 0
  ) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-dark-purple" />
      </div>
    );
  }

  if (handles.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>Add Codeforces handles to view problems</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h2 className="text-lg font-semibold text-foreground text-white">
          Problems List
          <span className="text-sm text-muted-foreground ml-2">
            ({totalProblemsCount} problems match current filters)
          </span>
        </h2>
        {userState.currentUser && (
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
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Solved</span>
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
              <XCircle className="mr-2 h-4 w-4" />
              <span>Unsolved</span>
            </Button>
          </div>
        )}
      </div>

      {handles.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground border-b pb-2 mb-4">
          <div>
            <span className="font-medium text-foreground text-white">
              Solved by:
            </span>
            {(() => {
              const otherHandles = userState.currentUser
                ? handles.filter((h) => h !== userState.currentUser)
                : [...handles];

              if (otherHandles.length === 0) {
                if (
                  handles.length > 0 &&
                  userState.currentUser &&
                  handles.some((h) => h === userState.currentUser)
                ) {
                  return (
                    <span className="ml-3 italic">
                      (No other handles to display initial counts for.)
                    </span>
                  );
                }
                return (
                  <span className="ml-3 italic">
                    (No user counts to display here.)
                  </span>
                );
              }

              return otherHandles.map((handle) => (
                <span key={handle} className="ml-3" title={handle}>
                  {handle.length > 15 ? `${handle.substring(0, 12)}...` : handle}
                  -&gt;
                  {isLoading &&
                  (initialProblemCounts[handle] === undefined ||
                    (initialProblemCounts[handle] === 0 &&
                      !problemsData[handle])) ? (
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                  ) : (
                    initialProblemCounts[handle] ?? "N/A"
                  )}
                </span>
              ));
            })()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      )}

      {!isLoading &&
        paginatedProblems.length === 0 &&
        handles.length > 0 &&
        Object.keys(problemsData).length === 0 && (
          <div className="text-center py-10 border border-border rounded-md bg-card">
            <p className="text-muted-foreground">
              Fetching problem data for selected handles... If this persists,
              try reducing the number of handles.
            </p>
          </div>
        )}

      {(!isLoading || Object.keys(problemsData).length > 0) &&
      paginatedProblems.length > 0 ? (
        <>
          <div className="glass-card rounded-lg border dark:border-dark-blue/30">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-b-gray-200 dark:border-dark-blue">
                  <TableHead className="text-foreground w-1/2 md:w-[30%] xl:w-[35%] text-center">
                    Problem Name
                  </TableHead>
                  <TableHead className="text-foreground w-[20%] md:w-[10%] text-center">
                    Rating
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-foreground md:w-[30%] xl:w-[20%] text-center">
                    Tags
                  </TableHead>
                  <TableHead className="text-foreground w-[30%] md:w-[30%] xl:w-[15%] text-center">
                    <span className="hidden sm:inline">Submissions</span>
                    <span className="sm:hidden">Links</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProblems.map((entry) => {
                  const { problemId, problemDetails, solvedBy } = entry;
                  const currentUserHandle = userState.currentUser;

                  const isSolvedByMainUser =
                    currentUserHandle &&
                    solvedProblemsByCurrentUser.has(problemId);
                  const hasIncorrectByMainUser =
                    currentUserHandle &&
                    !isSolvedByMainUser &&
                    incorrectSubmissionsForCurrentUser.has(problemId);

                  let rowClassName =
                    "border-b-gray-200/30 dark:border-dark-blue/30 transition-colors hover:bg-muted/50 dark:hover:bg-dark-blue/10";
                  if (isSolvedByMainUser) {
                    rowClassName +=
                      " bg-green-300 dark:bg-dark-green/45 hover:bg-green-400 hover:dark:bg-dark-green/40";
                  } else if (hasIncorrectByMainUser) {
                    rowClassName +=
                      " bg-red-300 dark:bg-dark-red/45 hover:bg-red-400 hover:dark:bg-dark-red/40";
                  }

                  const problemTags = problemDetails.tags || [];
                  const isSubmissionsExpanded =
                    expandedSubmissions.has(problemId);
                  const areTagsExpanded = expandedTags.has(problemId);

                  const submissionsToDisplay = solvedBy.filter(
                    (solver) =>
                      solver.handle !== currentUserHandle &&
                      solver.submissionId &&
                      solver.contestId
                  );

                  return (
                    <TableRow key={problemId} className={rowClassName}>
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
                      <TableCell
                        className={`py-2 pr-1 text-center ${getRatingClass(
                          problemDetails.rating
                        )}`}
                      >
                        {problemDetails.rating}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2 pr-1">
                        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[150px] lg:max-w-xs mx-auto">
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
                          {problemTags.length > INITIAL_TAG_LIMIT && (
                            <button
                              onClick={() => toggleTagsExpansion(problemId)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center h-[20px] px-1"
                            >
                              {areTagsExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                              (
                              {areTagsExpanded
                                ? "less"
                                : `+${
                                    problemTags.length - INITIAL_TAG_LIMIT
                                  }`}
                              )
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 pr-1">
                        {submissionsToDisplay.length > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {(isSubmissionsExpanded
                              ? submissionsToDisplay
                              : submissionsToDisplay.slice(
                                  0,
                                  INITIAL_DISPLAY_LIMIT
                                )
                            ).map((solver) => (
                              <a
                                key={`${solver.handle}-${solver.submissionId}`}
                                href={`https://codeforces.com/contest/${solver.contestId}/submission/${solver.submissionId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 truncate"
                                title={`View ${solver.handle}'s submission`}
                              >
                                <LinkIcon size={12} />
                                <span className="truncate">
                                  {solver.handle}
                                </span>
                              </a>
                            ))}
                            {submissionsToDisplay.length >
                              INITIAL_DISPLAY_LIMIT && (
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
                                      submissionsToDisplay.length -
                                      INITIAL_DISPLAY_LIMIT
                                    } more links`}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground block text-center">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
      ) : null}
      {!isLoading &&
        paginatedProblems.length === 0 &&
        handles.length > 0 &&
        Object.keys(problemsData).length > 0 && (
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