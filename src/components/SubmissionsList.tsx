import React, { useState, useEffect, useMemo } from "react";
import {
  CodeforcesProblem,
  CodeforcesSubmission,
  FilterOptions,
} from "@/types/codeforces";
import {
  getAcceptedSubmissions,
  getUniqueSolvedProblems,
  getUserSubmissions,
} from "@/services/codeforcesApi";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/UserContext";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SubmissionsListProps {
  handles: string[];
  filters: FilterOptions;
  setAvailableTags: React.Dispatch<React.SetStateAction<string[]>>;
}

const SubmissionsList: React.FC<SubmissionsListProps> = ({
  handles,
  filters,
  setAvailableTags,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<
    Record<string, CodeforcesSubmission[]>
  >({});
  const [problems, setProblems] = useState<Record<string, CodeforcesProblem[]>>(
    {}
  );
  const [incorrectSubmissions, setIncorrectSubmissions] = useState<Set<string>>(
    new Set()
  );
  const { toast } = useToast();
  const { userState } = useUserContext();
  const [currentUserProblems, setCurrentUserProblems] = useState<Set<string>>(
    new Set()
  );

  // Fetch submissions for all handles
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (handles.length === 0) return;

      setIsLoading(true);
      const newSubmissions: Record<string, CodeforcesSubmission[]> = {};
      const newProblems: Record<string, CodeforcesProblem[]> = {};
      const allTags = new Set<string>();
      const incorrectSet = new Set<string>(); // Renamed to avoid conflict with state variable

      try {
        for (const handle of handles) {
          try {
            // Get all submissions, not just accepted ones
            const allUserSubmissions = await getUserSubmissions(handle); // Renamed to avoid conflict
            newSubmissions[handle] = allUserSubmissions;

            // For problems, only count accepted submissions
            const acceptedUserSubmissions = allUserSubmissions.filter(
              (sub) => sub.verdict === "OK"
            ); // Renamed
            const uniqueProblems = getUniqueSolvedProblems(
              acceptedUserSubmissions
            );
            newProblems[handle] = uniqueProblems;

            // Collect all tags
            uniqueProblems.forEach((problem) => {
              if (problem.tags) {
                problem.tags.forEach((tag) => allTags.add(tag));
              }
            });

            // If this is the current user, record incorrect submissions
            if (handle === userState.currentUser) {
              const problemsWithIncorrectSubmissions = new Set<string>();

              // Find problems with at least one incorrect submission
              allUserSubmissions.forEach((submission) => {
                // Used renamed variable
                if (
                  submission.verdict !== "OK" &&
                  submission.problem.contestId
                ) {
                  const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
                  problemsWithIncorrectSubmissions.add(problemKey);
                }
              });

              setIncorrectSubmissions(problemsWithIncorrectSubmissions);
            }
          } catch (error) {
            console.error(`Error fetching submissions for ${handle}:`, error); // Log error for debugging
            toast({
              title: "Error fetching submissions",
              description: `Failed to fetch submissions for ${handle}. Please check console for details.`, // More informative
              variant: "destructive",
            });
          }
        }

        setSubmissions(newSubmissions);
        setProblems(newProblems);
        setAvailableTags(Array.from(allTags).sort());
      } catch (error) {
        console.error("Overall error fetching submissions:", error); // Log error
        toast({
          title: "Error",
          description:
            "Failed to fetch submissions. Please check console for details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [handles, toast, setAvailableTags, userState.currentUser]);

  // Create a set of problems solved by the current user
  useEffect(() => {
    const currentUser = userState.currentUser;
    if (currentUser && problems[currentUser]) {
      const problemSet = new Set<string>();
      problems[currentUser].forEach((problem) => {
        problemSet.add(`${problem.contestId}-${problem.index}`);
      });
      setCurrentUserProblems(problemSet);
    } else {
      setCurrentUserProblems(new Set());
    }
  }, [userState.currentUser, problems]);

  // Filter and sort problems based on current filters
  // Use useMemo to optimize this potentially expensive operation
  const getFilteredAndSortedProblems = (
    handle: string
  ): CodeforcesProblem[] => {
    const handleProblems = problems[handle] || [];

    return handleProblems
      .filter((problem) => {
        // Skip problems with no rating (N/A)
        if (problem.rating === undefined || problem.rating === null) {
          // Stricter check for undefined/null rating
          return false;
        }

        // Filter by rating
        if (
          problem.rating < filters.minRating ||
          problem.rating > filters.maxRating
        ) {
          return false;
        }

        // Filter by tags
        if (filters.tags.length > 0) {
          if (
            !problem.tags ||
            !filters.tags.some((tag) => problem.tags.includes(tag))
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (a.rating || 0) - (b.rating || 0)); // Sort by rating in ascending order
  };

  // Get rating class for color coding
  const getRatingClass = (rating: number | undefined) => {
    if (rating === undefined || rating === null) return ""; // Stricter check
    if (rating < 1200) return "rating-easy";
    if (rating < 1900) return "rating-medium";
    if (rating < 2400) return "rating-hard";
    return "rating-expert";
  };

  // Check if problem is solved by current user
  const isProblemSolvedByCurrentUser = (
    contestId: number | undefined,
    index: string
  ) => {
    if (contestId === undefined) return false; // Check for undefined contestId
    return currentUserProblems.has(`${contestId}-${index}`);
  };

  // Check if problem has incorrect submissions by current user
  const hasIncorrectSubmission = (
    contestId: number | undefined,
    index: string
  ) => {
    if (contestId === undefined || !userState.currentUser) return false; // Check for undefined contestId
    return incorrectSubmissions.has(`${contestId}-${index}`);
  };

  if (handles.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-dark-text/70">
        <p>Add Codeforces handles to track submissions</p>
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
    <div className="space-y-6">
      {handles.map((handle) => {
        // Skip rendering the current user's handle separately since their problems
        // will be highlighted in other users' lists
        if (userState.currentUser === handle) {
          return null;
        }

        const filteredAndSortedProblems = getFilteredAndSortedProblems(handle);

        return (
          <div key={handle} className="space-y-2">
            <h2 className="text-lg font-semibold text-primary dark:text-dark-purple">
              {handle}'s Solved Problems ({filteredAndSortedProblems.length})
            </h2>

            {filteredAndSortedProblems.length > 0 ? (
              <div className="overflow-x-auto glass-card rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-dark-blue">
                      <TableHead className="text-gray-700 dark:text-dark-text">
                        Problem
                      </TableHead>
                      <TableHead className="text-gray-700 dark:text-dark-text">
                        Rating
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-gray-700 dark:text-dark-text">
                        Tags
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedProblems.map((problem) => {
                      const isSolvedByCurrentUser =
                        isProblemSolvedByCurrentUser(
                          problem.contestId,
                          problem.index
                        );
                      const hasIncorrect = hasIncorrectSubmission(
                        problem.contestId,
                        problem.index
                      );

                      return (
                        <TableRow
                          key={`${problem.contestId}-${problem.index}`}
                          className={`border-gray-200/30 dark:border-dark-blue/30 hover-scale
                            ${
                              isSolvedByCurrentUser
                                ? "bg-green-200 dark:bg-dark-green/50 hover:bg-green-300 dark:hover:bg-dark-green/30"
                                : hasIncorrect
                                ? "bg-red-200 dark:bg-dark-red/50 hover:bg-red-300 dark:hover:bg-dark-red/30"
                                : "hover:bg-gray-50 dark:hover:bg-dark-blue/10"
                            }`}
                        >
                          <TableCell>
                            <a
                              href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary dark:text-dark-pink hover:underline problem-link"
                            >
                              {problem.name} ({problem.contestId}
                              {problem.index})
                            </a>
                          </TableCell>
                          <TableCell className={getRatingClass(problem.rating)}>
                            {problem.rating}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {/* Check if problem.tags exists before slicing */}
                              {problem.tags &&
                                problem.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="tag-badge">
                                    {tag}
                                  </span>
                                ))}
                              {/* Check if problem.tags exists for length calculation */}
                              {problem.tags && problem.tags.length > 3 && (
                                <span className="text-xs py-0.5 px-1.5 rounded bg-gray-100/80 dark:bg-dark-blue/10 text-gray-500 dark:text-dark-text/60">
                                  +{problem.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 border border-gray-200 dark:border-dark-blue/30 rounded-md bg-white dark:bg-dark-card">
                <p className="text-gray-500 dark:text-dark-text/70">
                  No problems match the current filters
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SubmissionsList;
