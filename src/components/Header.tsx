// Header.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUserContext } from "@/context/UserContext";
import { useThemeContext } from "@/context/ThemeContext";
import {
  CodeIcon,
  LogOut,
  UserIcon,
  BarChart3Icon,
  Wrench,
  BrainCircuit,
  Loader2,
  Link as LinkIconLucide,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { getAllProblems, getUserSubmissions } from "@/services/codeforcesApi";
import {
  DPP_LEVELS_CONFIG,
  generateDppSet,
  DPPLevel,
  DppProblemEntry as DppHelperDppProblemEntry,
  EliteSolverInfo as DppHelperEliteSolverInfo,
  processEliteUserSubmissions,
  ELITE_USERS_DPP as ELITE_USERS_FROM_HELPER,
} from "@/services/dppHelpers";
import { CodeforcesProblem, CodeforcesSubmission } from "@/types/codeforces";
import NeonButton from "@/components/ui/NeonButton";

const LOCAL_STORAGE_DPP_KEY_PREFIX = "cfBuddyDailyDpp_";
const INITIAL_DPP_TAG_LIMIT = 1;
// Updated data version to reflect changes in dppHelpers logic
const CURRENT_DPP_DATA_VERSION = "1.2"; // Changed from "1.1"

interface DppSetState {
  mainProblems: DppHelperDppProblemEntry[];
  warmUpProblems: DppHelperDppProblemEntry[];
}

interface StoredDppForLevel {
  level: DPPLevel;
  problems: DppSetState;
  dataVersion?: string;
}

interface DailyDppStorage {
  date: string;
  generatedSets: {
    [levelKey: string]: StoredDppForLevel;
  };
}

const getTodaysDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const getRatingClass = (rating: number | undefined): string => {
  if (rating === undefined || rating === null)
    return "text-gray-600 dark:text-gray-400";
  if (rating >= 3000) return "text-red-700 dark:text-red-500";
  if (rating >= 2600) return "text-red-600 dark:text-red-400";
  if (rating >= 2400) return "text-orange-600 dark:text-orange-400";
  if (rating >= 2300) return "text-orange-500 dark:text-orange-300";
  if (rating >= 2100) return "text-yellow-500 dark:text-yellow-400";
  if (rating >= 1900) return "text-purple-500 dark:text-purple-400";
  if (rating >= 1600) return "text-blue-500 dark:text-blue-400";
  if (rating >= 1400) return "text-cyan-500 dark:text-cyan-400";
  if (rating >= 1200) return "text-green-500 dark:text-green-400";
  return "text-gray-500 dark:text-gray-400";
};

const Header = () => {
  const { userState, signIn, signOut: contextSignOut } = useUserContext();
  const { theme, toggleTheme } = useThemeContext();
  const [signInHandle, setSignInHandle] = useState("");
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isDppDialogOpen, setIsDppDialogOpen] = useState(false);
  const [selectedDppLevel, setSelectedDppLevel] = useState<DPPLevel>(
    DPP_LEVELS_CONFIG[0]
  );
  const [dppProblems, setDppProblems] = useState<DppSetState | null>(null);
  const [isLoadingDpp, setIsLoadingDpp] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  const [allProblemsCache, setAllProblemsCache] = useState<CodeforcesProblem[]>(
    []
  );
  const [solvedProblemKeysCache, setSolvedProblemKeysCache] = useState<
    Set<string>
  >(new Set());
  const [eliteUserSolutionsCache, setEliteUserSolutionsCache] = useState<
    Map<string, DppHelperEliteSolverInfo[]>
  >(new Map());

  const [
    isDppGeneratedForSelectedLevelToday,
    setIsDppGeneratedForSelectedLevelToday,
  ] = useState(false);
  const [isLoadedDppStale, setIsLoadedDppStale] = useState(false);
  const [expandedDppProblemTags, setExpandedDppProblemTags] = useState<
    Set<string>
  >(new Set());

  const getLocalStorageKeyForUserDpp = useCallback(() => {
    if (!userState.currentUser) return null;
    return `${LOCAL_STORAGE_DPP_KEY_PREFIX}${userState.currentUser}`;
  }, [userState.currentUser]);

  useEffect(() => {
    const userDppKey = getLocalStorageKeyForUserDpp();
    setDppProblems(null);
    setIsDppGeneratedForSelectedLevelToday(false);
    setIsLoadedDppStale(false);
    setExpandedDppProblemTags(new Set());

    if (!userDppKey) return;

    const storedDppJson = localStorage.getItem(userDppKey);
    const today = getTodaysDateString();
    let currentDailyStorage: DailyDppStorage | null = null;

    if (storedDppJson) {
      try {
        const parsedStorage: DailyDppStorage = JSON.parse(storedDppJson);
        if (parsedStorage.date === today) {
          currentDailyStorage = parsedStorage;
        } else {
          localStorage.removeItem(userDppKey);
        }
      } catch (error) {
        console.error("Failed to parse stored DPP from localStorage:", error);
        localStorage.removeItem(userDppKey);
      }
    }

    const levelKey = selectedDppLevel.level.toString();
    if (currentDailyStorage?.generatedSets[levelKey]) {
      const storedSetForLevel = currentDailyStorage.generatedSets[levelKey];
      const problemsFromLS = storedSetForLevel.problems;

      // The existing check is reasonable. `solvedByElite` key presence is a basic check.
      // The main driver for invalidation due to logic change is the version number.
      const firstProblem =
        problemsFromLS.mainProblems?.[0] || problemsFromLS.warmUpProblems?.[0];
      const isDataStructureValid =
        !firstProblem || "solvedByElite" in firstProblem;

      const isVersionMatch =
        storedSetForLevel.dataVersion === CURRENT_DPP_DATA_VERSION;

      if (isDataStructureValid && isVersionMatch) {
        setDppProblems(problemsFromLS);
        setIsDppGeneratedForSelectedLevelToday(true);
        setIsLoadedDppStale(false);
      } else {
        setDppProblems(null);
        setIsDppGeneratedForSelectedLevelToday(false);
        setIsLoadedDppStale(true);
        toast({
          title: "Stale DPP Data",
          description: `Previously saved DPP for ${selectedDppLevel.name} has an outdated format or version. Please regenerate it.`,
          variant: "default",
          duration: 7000,
        });
      }
    }
  }, [
    userState.currentUser,
    selectedDppLevel,
    getLocalStorageKeyForUserDpp,
    toast,
    setDppProblems,
    setIsDppGeneratedForSelectedLevelToday,
    setIsLoadedDppStale,
    setExpandedDppProblemTags,
  ]);

  useEffect(() => {
    const executeFetches = async () => {
      if (allProblemsCache.length === 0) {
        try {
          const problems = await getAllProblems();
          setAllProblemsCache(problems);
        } catch (error) {
          console.error("Failed to pre-fetch all problems for DPP:", error);
          toast({
            title: "DPP Error",
            description: "Could not load problemset.",
          });
        }
      }

      if (userState.currentUser && solvedProblemKeysCache.size === 0) {
        try {
          const submissions = await getUserSubmissions(userState.currentUser);
          const solvedKeys = new Set<string>(
            submissions
              .filter(
                (s) =>
                  s.verdict === "OK" && s.problem.contestId && s.problem.index
              )
              .map((s) => `${s.problem.contestId}-${s.problem.index}`)
          );
          setSolvedProblemKeysCache(solvedKeys);
        } catch (error) {
          console.error(
            `Failed to fetch solved keys for ${userState.currentUser}:`,
            error
          );
          setSolvedProblemKeysCache(new Set());
          toast({
            title: "User Data Error",
            description: `Could not load your solved problems.`,
          });
        }
      }

      if (
        eliteUserSolutionsCache.size === 0 &&
        ELITE_USERS_FROM_HELPER.length > 0
      ) {
        try {
          const eliteSubmissionsPromises = ELITE_USERS_FROM_HELPER.map(
            (handle) =>
              getUserSubmissions(handle)
                .then((submissions) => ({ handle, submissions }))
                .catch((error) => {
                  console.warn(
                    `Failed to fetch submissions for elite user ${handle} (for DPP):`,
                    error
                  );
                  return { handle, submissions: [] as CodeforcesSubmission[] };
                })
          );
          const eliteSubmissionsResults = await Promise.all(
            eliteSubmissionsPromises
          );
          const validResults = eliteSubmissionsResults.filter(
            (r) => r !== null
          ) as { handle: string; submissions: CodeforcesSubmission[] }[];
          const processedSolutions = processEliteUserSubmissions(validResults);
          setEliteUserSolutionsCache(processedSolutions);

          if (
            processedSolutions.size === 0 &&
            ELITE_USERS_FROM_HELPER.length > 0
          ) {
            toast({
              title: "Elite Data Issue",
              description:
                "Could not fetch solutions for any elite users. DPP may not generate as expected.",
              variant: "destructive",
              duration: 7000,
            });
          }
        } catch (error) {
          console.error(
            "Failed to fetch or process elite user submissions for DPP:",
            error
          );
          setEliteUserSolutionsCache(new Map());
          toast({
            title: "DPP Data Error",
            description: "Could not load elite user solutions.",
          });
        }
      }
    };

    const needsProblemFetch = allProblemsCache.length === 0;
    const needsUserKeysFetch =
      !!userState.currentUser && solvedProblemKeysCache.size === 0;
    const needsEliteSolutionsFetch =
      eliteUserSolutionsCache.size === 0 && ELITE_USERS_FROM_HELPER.length > 0;

    const shouldInitiateFetch =
      needsProblemFetch ||
      needsEliteSolutionsFetch ||
      needsUserKeysFetch ||
      (isDppDialogOpen &&
        (needsProblemFetch || needsUserKeysFetch || needsEliteSolutionsFetch));

    if (shouldInitiateFetch) {
      setIsLoadingInitialData(true);
      executeFetches().finally(() => {
        setIsLoadingInitialData(false);
      });
    } else if (isLoadingInitialData && !shouldInitiateFetch) {
      setIsLoadingInitialData(false);
    }
  }, [
    userState.currentUser,
    toast,
    allProblemsCache.length,
    eliteUserSolutionsCache.size,
    solvedProblemKeysCache.size,
    isDppDialogOpen,
    setAllProblemsCache,
    setSolvedProblemKeysCache,
    setEliteUserSolutionsCache,
    isLoadingInitialData,
  ]);

  const handleSignInSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (signInHandle.trim()) {
        const success = await signIn(signInHandle.trim());
        if (success) {
          setSignInHandle("");
          setIsSignInDialogOpen(false);
        }
      }
    },
    [signIn, signInHandle, setSignInHandle, setIsSignInDialogOpen]
  );

  const handleSignOut = useCallback(() => {
    contextSignOut();
    setSelectedDppLevel(DPP_LEVELS_CONFIG[0]);
    setDppProblems(null);
    setIsDppGeneratedForSelectedLevelToday(false);
    setIsLoadedDppStale(false);
    setSolvedProblemKeysCache(new Set());
  }, [
    contextSignOut,
    setSelectedDppLevel,
    setDppProblems,
    setIsDppGeneratedForSelectedLevelToday,
    setIsLoadedDppStale,
    setSolvedProblemKeysCache,
  ]);

  const handleAnalyticsClick = useCallback(() => {
    if (userState.currentUser) navigate(`/analytics/${userState.currentUser}`);
    else navigate("/analytics");
  }, [navigate, userState.currentUser]);

  const handleLogoClick = useCallback(() => navigate("/"), [navigate]);

  const handleLogoKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleLogoClick();
      }
    },
    [handleLogoClick]
  );

  const handleDppDialogOpeChange = useCallback(
    (open: boolean) => {
      setIsDppDialogOpen(open);
      if (!open) {
        setExpandedDppProblemTags(new Set());
      }
    },
    [setIsDppDialogOpen, setExpandedDppProblemTags]
  );

  const handleGenerateDpp = useCallback(() => {
    if (!userState.currentUser) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to generate DPPs.",
      });
      setIsDppDialogOpen(false);
      setIsSignInDialogOpen(true);
      return;
    }

    if (isDppGeneratedForSelectedLevelToday && !isLoadedDppStale) {
      toast({
        title: "DPP Already Available",
        variant: "info",
        description:
          "A DPP for this level was already generated or loaded for today. Regenerate if you want a new set.",
      });
      // Allow regeneration even if already generated, so don't return early.
      // The button text changes to "Regenerate Set".
      // The actual check for whether to proceed with generation or not is handled by isGenerateDppButtonDisabled logic for enabling/disabling the button
      // and the explicit intent of the user clicking "Regenerate Set".
      // For safety, we will proceed as if a new set is requested.
    }
    if (isLoadedDppStale) {
      setIsLoadedDppStale(false); // Will be regenerated, so not stale anymore.
    }

    if (allProblemsCache.length === 0 || isLoadingInitialData) {
      toast({
        title: "Data Loading",
        description:
          "Required problem data is still loading. Please wait a moment and try again.",
        variant: "default",
      });
      return;
    }
    if (
      eliteUserSolutionsCache.size === 0 &&
      ELITE_USERS_FROM_HELPER.length > 0 &&
      !isLoadingInitialData
    ) {
      toast({
        title: "Elite Data Missing",
        description:
          "Elite user solution data could not be loaded. DPP may not contain intended problems. You can try generating, or check back later.",
        variant: "warning",
        duration: 7000,
      });
      // Do not return here, allow generation attempt, generateDppSet will likely return empty.
    }

    setIsLoadingDpp(true);
    setDppProblems(null);
    setExpandedDppProblemTags(new Set());

    setTimeout(() => {
      try {
        const generatedSet = generateDppSet(
          selectedDppLevel,
          allProblemsCache,
          solvedProblemKeysCache,
          eliteUserSolutionsCache
        );

        if (
          generatedSet.mainProblems.length === 0 &&
          generatedSet.warmUpProblems.length === 0
        ) {
          const hasEliteSolutions = eliteUserSolutionsCache.size > 0;
          if (!hasEliteSolutions && ELITE_USERS_FROM_HELPER.length > 0) {
            toast({
              title: "No Problems Generated",
              description:
                "Could not find problems. This might be due to issues fetching elite user solutions. The new DPP logic requires problems to have known elite solutions.",
              variant: "warning",
              duration: 10000,
            });
          } else {
            toast({
              title: "No Problems Generated",
              description:
                "Could not find problems matching the criteria (rating, solved by elite, unsolved by you). Try a different level or check if you've solved many problems in this range.",
              variant: "default",
              duration: 7000,
            });
          }
        }

        setDppProblems(generatedSet as DppSetState);
        setIsDppGeneratedForSelectedLevelToday(true);
        setIsLoadedDppStale(false); // Mark as not stale after generation

        const userDppKey = getLocalStorageKeyForUserDpp();
        if (userDppKey) {
          const today = getTodaysDateString();
          const newStorageEntry: StoredDppForLevel = {
            level: selectedDppLevel,
            problems: generatedSet as DppSetState,
            dataVersion: CURRENT_DPP_DATA_VERSION,
          };

          let dailyData: DailyDppStorage;
          const rawExisting = localStorage.getItem(userDppKey);
          if (rawExisting) {
            try {
              const parsed = JSON.parse(rawExisting) as DailyDppStorage;
              dailyData =
                parsed.date === today
                  ? parsed
                  : { date: today, generatedSets: {} };
            } catch {
              dailyData = { date: today, generatedSets: {} };
            }
          } else {
            dailyData = { date: today, generatedSets: {} };
          }
          dailyData.generatedSets[selectedDppLevel.level.toString()] =
            newStorageEntry;
          localStorage.setItem(userDppKey, JSON.stringify(dailyData));
        }

        if (
          !(
            generatedSet.mainProblems.length === 0 &&
            generatedSet.warmUpProblems.length === 0
          )
        ) {
          toast({
            title: "DPP Generated!",
            description: `New DPP for ${selectedDppLevel.name} is ready.`,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during DPP generation.";
        toast({
          title: "DPP Generation Error",
          description: message,
          variant: "destructive",
        });
        setDppProblems(null);
        setIsDppGeneratedForSelectedLevelToday(false);
      } finally {
        setIsLoadingDpp(false);
      }
    }, 50);
  }, [
    userState.currentUser,
    toast,
    setIsDppDialogOpen,
    setIsSignInDialogOpen,
    isDppGeneratedForSelectedLevelToday, // Used to determine button text, not to block regeneration
    isLoadedDppStale,
    setIsLoadedDppStale,
    allProblemsCache,
    isLoadingInitialData,
    eliteUserSolutionsCache,
    setIsLoadingDpp,
    setDppProblems,
    setExpandedDppProblemTags,
    selectedDppLevel,
    solvedProblemKeysCache,
    getLocalStorageKeyForUserDpp,
  ]);

  const handleDppLevelChange = useCallback(
    (levelValue: string) => {
      const levelNum = parseInt(levelValue, 10);
      const newLevel =
        DPP_LEVELS_CONFIG.find((l) => l.level.toString() === levelValue) || // Match by string value from select
        DPP_LEVELS_CONFIG[0];
      setSelectedDppLevel(newLevel);
    },
    [setSelectedDppLevel]
  );

  const toggleDppProblemTagsExpansion = useCallback(
    (problemKey: string) => {
      setExpandedDppProblemTags((prev) => {
        const next = new Set(prev);
        if (next.has(problemKey)) {
          next.delete(problemKey);
        } else {
          next.add(problemKey);
        }
        return next;
      });
    },
    [setExpandedDppProblemTags]
  );

  const isGenerateDppButtonDisabled = useMemo(() => {
    // Button should be disabled if loading, or if essential data isn't ready and not loading.
    // It should NOT be disabled if a DPP is already generated but the user wants to regenerate.
    return (
      isLoadingDpp ||
      isLoadingInitialData ||
      !userState.currentUser ||
      (allProblemsCache.length === 0 && !isLoadingInitialData)
      // Removed: (isDppGeneratedForSelectedLevelToday && !isLoadedDppStale)
      // This condition prevented regeneration. Now, the button text changes and allows regeneration.
    );
  }, [
    isLoadingDpp,
    isLoadingInitialData,
    userState.currentUser,
    allProblemsCache.length,
    // isDppGeneratedForSelectedLevelToday, // No longer makes button disabled
    // isLoadedDppStale, // No longer makes button disabled
  ]);

  const renderProblemTable = useCallback(
    (
      problems: DppHelperDppProblemEntry[],
      title: string,
      titleColor: string
    ) => {
      if (!problems || problems.length === 0) return null;

      return (
        <section className="mt-2">
          <h3
            className={`text-lg sm:text-xl font-semibold mb-2 sm:mb-3 ${titleColor}`}
          >
            {title} ({problems.length})
          </h3>
          <div className="border rounded-md dark:border-dark-blue/50 overflow-x-auto">
            <Table className="min-w-full text-sm table-fixed">
              <TableHeader>
                <TableRow className="dark:border-dark-blue/30 bg-muted/50 dark:bg-dark-card/30">
                  <TableHead className="w-[35%] sm:w-[30%] pl-3 pr-1 py-2.5 text-foreground dark:text-gray-300">
                    Problem Name
                  </TableHead>
                  <TableHead className="w-[15%] sm:w-[10%] px-1 py-2.5 text-center text-foreground dark:text-gray-300">
                    Rating
                  </TableHead>
                  <TableHead className="w-[25%] sm:w-[35%] px-1 py-2.5 text-center text-foreground dark:text-gray-300">
                    Tags
                  </TableHead>
                  <TableHead className="w-[25%] sm:w-[25%] pl-1 pr-3 py-2.5 text-center text-foreground dark:text-gray-300">
                    Solutions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((p) => {
                  const problemKey = `${p.contestId}-${p.index}`;
                  const problemTags = p.tags || [];
                  const areTagsExpanded =
                    expandedDppProblemTags.has(problemKey);
                  const problemUrl = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
                  const eliteSolvers = p.solvedByElite || []; // Still safe with || [], though new helper guarantees non-empty array if present.

                  return (
                    <TableRow
                      key={problemKey}
                      className="dark:border-dark-blue/30 hover:bg-muted/50 dark:hover:bg-dark-card/50 transition-colors duration-150"
                    >
                      <TableCell className="pl-3 pr-1 py-2.5 align-middle">
                        <a
                          href={problemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group text-foreground dark:text-gray-200 hover:text-primary dark:hover:text-teal-400 font-medium"
                        >
                          <span
                            className="block truncate"
                            title={`${p.name} (${p.contestId}${p.index})`}
                          >
                            {p.name}
                          </span>
                        </a>
                      </TableCell>
                      <TableCell
                        className={`px-1 py-2.5 text-center font-semibold align-middle ${getRatingClass(
                          p.rating
                        )}`}
                      >
                        {p.rating ?? "N/A"}
                      </TableCell>
                      <TableCell className="px-1 py-2.5 align-middle">
                        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[150px] md:max-w-[200px] mx-auto">
                          {(areTagsExpanded
                            ? problemTags
                            : problemTags.slice(0, INITIAL_DPP_TAG_LIMIT)
                          ).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs truncate px-1.5 py-0.5 bg-secondary/10 dark:bg-dark-blue/40 text-foreground dark:text-gray-300 cursor-default"
                              title={tag}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {problemTags.length > INITIAL_DPP_TAG_LIMIT && (
                            <button
                              onClick={() =>
                                toggleDppProblemTagsExpansion(problemKey)
                              }
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center h-[18px] px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                              title={
                                areTagsExpanded
                                  ? "Show fewer tags"
                                  : `Show ${
                                      problemTags.length - INITIAL_DPP_TAG_LIMIT
                                    } more tag(s)`
                              }
                            >
                              {areTagsExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                              <span className="ml-0.5 sr-only">
                                {areTagsExpanded ? "less" : "more"}
                              </span>
                              {!areTagsExpanded && (
                                <span className="ml-0.5">
                                  (+{problemTags.length - INITIAL_DPP_TAG_LIMIT}
                                  )
                                </span>
                              )}
                            </button>
                          )}
                          {problemTags.length === 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                              No tags
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="pl-1 pr-3 py-2.5 text-center align-middle">
                        {eliteSolvers.length > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {eliteSolvers.slice(0, 3).map((solver) => (
                              <a
                                key={`${solver.handle}-${solver.submissionId}`}
                                href={`https://codeforces.com/contest/${solver.contestId}/submission/${solver.submissionId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 p-0.5 rounded-md space-x-1.5 group w-full max-w-[120px] hover:bg-blue-500/10 dark:hover:bg-blue-400/10 transition-colors duration-150"
                                title={`View ${solver.handle}'s solution`}
                              >
                                <LinkIconLucide
                                  size={14}
                                  className="flex-shrink-0"
                                />
                                <span className="text-xs truncate font-medium">
                                  {solver.handle}
                                </span>
                              </a>
                            ))}
                            {eliteSolvers.length > 3 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                (+{eliteSolvers.length - 3} more)
                              </span>
                            )}
                          </div>
                        ) : (
                          <a
                            href={problemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 p-1 rounded-md space-x-1 group hover:bg-teal-500/10 dark:hover:bg-teal-400/10 transition-colors duration-150"
                            title="Solve problem on Codeforces"
                          >
                            <ExternalLink size={16} className="flex-shrink-0" />
                            <span className="text-xs">Solve</span>
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      );
    },
    [expandedDppProblemTags, toggleDppProblemTagsExpansion]
  );

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40 py-3 px-4 sm:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-x-2">
        <div
          onClick={handleLogoClick}
          className="flex items-center space-x-2 cursor-pointer flex-shrink-0 group"
          role="button"
          tabIndex={0}
          onKeyDown={handleLogoKeyDown}
          aria-label="Go to homepage"
        >
          <CodeIcon className="h-8 w-8 text-primary animate-pulse group-hover:text-accent transition-colors duration-300" />
          <h1 className="text-2xl font-display font-bold text-foreground tracking-widest group-hover:text-glow transition-all duration-300">
            CF<span className="text-primary">-</span>
            <span className="text-secondary">BUDDY</span>
          </h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
            aria-label={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button> */}
          <Button
            variant="ghost"
            onClick={handleAnalyticsClick}
            className="inline-flex items-center text-gray-700 dark:text-dark-text  dark:hover:bg-dark-blue/10 rounded-md p-1.5 lg:px-3 lg:py-1.5"
            title="View Analytics"
          >
            <BarChart3Icon className="h-5 w-5 lg:mr-2" />{" "}
            <span className="hidden lg:inline">Analytics</span>
          </Button>

          <Dialog
            open={isDppDialogOpen}
            onOpenChange={handleDppDialogOpeChange}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="hidden lg:inline-flex border-teal-500 text-teal-600 hover:bg-teal-500/10 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400/10 h-9 px-3"
                title="Daily Practice Problems"
              >
                <BrainCircuit className="mr-1.5 h-4 w-4" /> DPP
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-3xl xl:max-w-4xl bg-white dark:bg-dark-bg dark:border-dark-border max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b dark:border-dark-blue/50">
                <DialogTitle className="text-xl text-teal-600 dark:text-teal-400">
                  Daily Practice Problems (DPP)
                </DialogTitle>
                <DialogDescription className="dark:text-gray-400 text-xs sm:text-sm">
                  ⚠️ Select level according to your current ranking, "RT" is the
                  required time to solve a question.
                  <br />
                  ⚠️ Log in to Codeforces in your browser to view solutions.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <label
                    htmlFor="dpp-level-select"
                    className="text-sm font-medium text-gray-700 dark:text-dark-text flex-shrink-0"
                  >
                    Select Level:
                  </label>
                  <Select
                    value={selectedDppLevel.level.toString()}
                    onValueChange={handleDppLevelChange}
                    aria-labelledby="dpp-level-select"
                  >
                    <SelectTrigger
                      id="dpp-level-select"
                      className="w-full sm:flex-grow bg-gray-50 dark:bg-dark-card border-gray-300 dark:border-dark-blue focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
                    >
                      <SelectValue placeholder="Choose a DPP level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-dark-card dark:border-dark-blue max-h-60">
                      {DPP_LEVELS_CONFIG.map((lvl) => (
                        <SelectItem
                          key={`${lvl.name}-${lvl.level}`} // Use a more unique key if level numbers can be duplicated across names
                          value={lvl.level.toString()}
                          className="focus:bg-teal-100 dark:focus:bg-teal-700/50"
                        >
                          {lvl.name} (Rating: {lvl.ratingRange.min}-
                          {lvl.ratingRange.max})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleGenerateDpp}
                    disabled={isGenerateDppButtonDisabled}
                    className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 disabled:cursor-not-allowed dark:bg-teal-400 dark:hover:bg-teal-500 dark:text-black dark:disabled:bg-teal-400/50 flex items-center justify-center"
                  >
                    {isLoadingDpp ||
                    (isLoadingInitialData &&
                      !dppProblems &&
                      !isDppGeneratedForSelectedLevelToday) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wrench className="mr-2 h-4 w-4" />
                    )}
                    {isLoadedDppStale || isDppGeneratedForSelectedLevelToday
                      ? "Regenerate Set"
                      : "Generate Set"}
                  </Button>
                </div>

                {isLoadedDppStale && (
                  <div className="my-2 p-3 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-400 dark:border-yellow-700 rounded-md text-yellow-700 dark:text-yellow-200 text-xs sm:text-sm flex items-center gap-2 justify-center">
                    <AlertTriangle size={18} /> Stored DPP data is outdated.
                    Please regenerate the set for the latest problems.
                  </div>
                )}

                {isLoadingInitialData &&
                  !dppProblems &&
                  !isDppGeneratedForSelectedLevelToday &&
                  !isLoadedDppStale && (
                    <div className="flex flex-col justify-center items-center py-10 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-500 dark:text-teal-400" />
                      <p className="ml-3 mt-2 text-md text-gray-600 dark:text-gray-400">
                        Loading initial problem data...
                      </p>
                    </div>
                  )}
                {isLoadingDpp && !isLoadingInitialData && (
                  <div className="flex flex-col justify-center items-center py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-500 dark:text-teal-400" />
                    <p className="ml-3 mt-2 text-md text-gray-600 dark:text-gray-400">
                      Generating your DPP set...
                    </p>
                  </div>
                )}

                {!isLoadingDpp && !isLoadingInitialData && dppProblems && (
                  <div className="space-y-6">
                    {renderProblemTable(
                      dppProblems.warmUpProblems,
                      "Warm-up Problems",
                      "text-orange-600 dark:text-orange-400"
                    )}
                    {renderProblemTable(
                      dppProblems.mainProblems,
                      "Main Problems",
                      "text-teal-600 dark:text-teal-400"
                    )}
                    {dppProblems.mainProblems.length === 0 &&
                      dppProblems.warmUpProblems.length === 0 &&
                      !isLoadedDppStale && (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                          No problems found matching the current criteria for{" "}
                          {selectedDppLevel.name}. Try a different level or
                          check back later.
                        </p>
                      )}
                  </div>
                )}
                {!isLoadingDpp &&
                  !isLoadingInitialData &&
                  !dppProblems &&
                  userState.currentUser &&
                  !isLoadedDppStale && (
                    <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                      {allProblemsCache.length === 0 && !isLoadingInitialData
                        ? "Problem data could not be loaded. Please try again later or refresh the page."
                        : eliteUserSolutionsCache.size === 0 &&
                          ELITE_USERS_FROM_HELPER.length > 0 &&
                          !isLoadingInitialData
                        ? "Elite user solutions could not be fully loaded. DPP generation may be incomplete. You can still try generating a set."
                        : isDppGeneratedForSelectedLevelToday // This case means dppProblems is null, but it was "generated" (i.e., loaded from LS but then cleared due to version/stale)
                        ? `DPP for ${selectedDppLevel.name} needs to be regenerated or was empty.`
                        : 'Select a level and click "Generate Set" to get your daily problems.'}
                    </div>
                  )}
                {!userState.currentUser &&
                  !isLoadingInitialData &&
                  !isLoadedDppStale && (
                    <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                      Please sign in to generate and view your Daily Practice
                      Problems.
                    </div>
                  )}
              </div>
              <DialogFooter className="px-6 py-4 border-t dark:border-dark-blue/50">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {userState.currentUser ? (
            <div className="flex items-center space-x-1 sm:space-x-2 bg-green-100 dark:bg-dark-green/30 px-2 sm:px-3 py-1.5 rounded-full">
              <div className="block sm:hidden" title={userState.currentUser}>
                <UserIcon
                  className="h-5 w-5 text-green-700 dark:text-dark-green"
                  aria-label={`User: ${userState.currentUser}`}
                />
              </div>
              <span
                className="hidden sm:inline font-semibold text-sm text-green-700 dark:text-dark-green truncate max-w-[70px] xs:max-w-[80px] sm:max-w-[100px] md:max-w-[120px]"
                title={userState.currentUser}
              >
                {userState.currentUser}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign Out"
                className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 dark:text-red-400"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          ) : (
            <Dialog
              open={isSignInDialogOpen}
              onOpenChange={setIsSignInDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-primary dark:border-dark-purple hover:bg-primary/10 dark:hover:bg-dark-purple/20 h-9 px-3 text-xs sm:text-sm"
                >
                  <UserIcon className="mr-0 h-4 w-4 sm:mr-1.5" />{" "}
                  <span className="xs:inline">Sign In</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[380px] bg-white dark:bg-dark-bg dark:border-dark-border">
                <DialogHeader>
                  <DialogTitle className="text-primary dark:text-dark-pink">
                    Sign In to CF-Buddy
                  </DialogTitle>
                  <DialogDescription className="dark:text-gray-400 text-xs sm:text-sm">
                    Enter your Codeforces handle to access personalized
                    features.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignInSubmit} className="space-y-4 pt-4">
                  <div>
                    <label
                      htmlFor="signin-handle"
                      className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1"
                    >
                      Codeforces Handle
                    </label>
                    <Input
                      id="signin-handle"
                      value={signInHandle}
                      onChange={(e) => setSignInHandle(e.target.value)}
                      placeholder="e.g., tourist"
                      required
                      className="bg-gray-50 dark:bg-dark-card border-gray-300 dark:border-dark-blue focus:ring-2 focus:ring-primary dark:focus:ring-dark-pink"
                      aria-describedby="signin-handle-description"
                    />
                    <p
                      id="signin-handle-description"
                      className="mt-1 text-xs text-gray-500 dark:text-gray-400"
                    >
                      Your handle is used to fetch your submission history.
                    </p>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button
                      type="submit"
                      disabled={!signInHandle.trim()}
                      className="w-full bg-primary hover:bg-primary/90 dark:bg-dark-purple dark:hover:bg-dark-purple/90 text-white dark:text-dark-text"
                    >
                      Sign In
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
