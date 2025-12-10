// Header.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { MdOutlineDashboard } from "react-icons/md";
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
import { useNavigate, useLocation } from "react-router-dom";
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
import ProblemTable from "@/components/ProblemTable";

// Updated data version to reflect changes in dppHelpers logic
const CURRENT_DPP_DATA_VERSION = "1.2"; // Changed from "1.1"

interface DppSetState {
  mainProblems: DppHelperDppProblemEntry[];
  warmUpProblems: DppHelperDppProblemEntry[];
}

const getTodaysDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

import { saveDpp, getDppByDate } from "@/services/dppService";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";

const Header = () => {
  const { userState, linkHandle, unlinkHandle } = useUserContext();
  const { user } = useUser(); // Clerk user
  const { theme, toggleTheme } = useThemeContext();
  const [signInHandle, setSignInHandle] = useState("");
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

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
  // New state to enforce "One DPP per day" strictly
  const [hasGeneratedDppToday, setHasGeneratedDppToday] = useState(false);

  // Initial Fetch of Today's DPPs
  useEffect(() => {
    const fetchDpp = async () => {
      // Don't reset everything blindly, we might be just refreshing data
      // But for simplicity on mount/user-change:
      setDppProblems(null);
      setIsDppGeneratedForSelectedLevelToday(false);
      setIsLoadedDppStale(false);
      setHasGeneratedDppToday(false);

      if (!user?.id) return;

      try {
        const today = getTodaysDateString();
        const dppData = await getDppByDate(user.id, today);

        if (dppData) {
          const mainProblems = dppData.problems.filter(
            (p: any) => p.category === "main"
          );
          const warmUpProblems = dppData.problems.filter(
            (p: any) => p.category === "warmup"
          );

          setDppProblems({ mainProblems, warmUpProblems });
          setIsDppGeneratedForSelectedLevelToday(true);
          setHasGeneratedDppToday(true); // Enforce strict check

          // Enforce the level from DB (Since only one allowed)
          const dbLevel = DPP_LEVELS_CONFIG.find(
            (l) => l.level === dppData.level
          );
          if (dbLevel) {
            setSelectedDppLevel(dbLevel);
          }
        } else {
          // No data for today
          setDppProblems(null);
          setIsDppGeneratedForSelectedLevelToday(false);
          setHasGeneratedDppToday(false);
        }
      } catch (error) {
        console.log("No DPP found for today or error fetching:", error);
      }
    };

    fetchDpp();
  }, [
    user?.id,
    userState.currentUser,
    toast,
    // Avoid circular dependency with setDppProblems/etc.
  ]);

  // ... (unchanged code) ...

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

  // Sync DPP progress with backend
  useEffect(() => {
    if (
      !dppProblems ||
      !user?.id ||
      !isDppGeneratedForSelectedLevelToday ||
      isLoadingInitialData ||
      !userState.currentUser
    )
      return;

    const today = getTodaysDateString();

    const mainProblemsPayload = dppProblems.mainProblems.map((p) => ({
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating,
      tags: p.tags,
      link: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      category: "main",
      solved: solvedProblemKeysCache.has(`${p.contestId}-${p.index}`),
      solvedByElite: p.solvedByElite, // Include elite solution data
    }));

    const warmUpProblemsPayload = dppProblems.warmUpProblems.map((p) => ({
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating,
      tags: p.tags,
      link: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      category: "warmup",
      solved: solvedProblemKeysCache.has(`${p.contestId}-${p.index}`),
      solvedByElite: p.solvedByElite, // Include elite solution data
    }));

    const payload = {
      userId: user.id,
      handle: userState.currentUser,
      date: today,
      level: selectedDppLevel.level,
      problems: [...mainProblemsPayload, ...warmUpProblemsPayload],
    };

    saveDpp(payload).catch((err) => console.error("Auto-sync DPP failed", err));
  }, [
    dppProblems,
    solvedProblemKeysCache,
    user?.id,
    userState.currentUser,
    selectedDppLevel.level,
    isDppGeneratedForSelectedLevelToday,
    isLoadingInitialData,
  ]);

  const handleSignInSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (signInHandle.trim()) {
        const success = await linkHandle(signInHandle.trim());
        if (success) {
          setSignInHandle("");
          setIsSignInDialogOpen(false);
        }
      }
    },
    [linkHandle, signInHandle, setSignInHandle, setIsSignInDialogOpen]
  );

  const handleSignOut = useCallback(() => {
    unlinkHandle();
    setSelectedDppLevel(DPP_LEVELS_CONFIG[0]);
    setDppProblems(null);
    setIsDppGeneratedForSelectedLevelToday(false);
    setIsLoadedDppStale(false);
    setSolvedProblemKeysCache(new Set());
  }, [
    unlinkHandle,
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
        // Reset logic if needed
      }
    },
    [setIsDppDialogOpen]
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
        setHasGeneratedDppToday(true);
        setIsLoadedDppStale(false); // Mark as not stale after generation

        setIsLoadedDppStale(false); // Mark as not stale after generation

        // We no longer save to LocalStorage.
        // The auto-sync useEffect (watching dppProblems) will handle saving to MongoDB.

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
    isDppGeneratedForSelectedLevelToday,
    isLoadedDppStale,
    setIsLoadedDppStale,
    allProblemsCache,
    isLoadingInitialData,
    eliteUserSolutionsCache,
    setIsLoadingDpp,
    setDppProblems,
    selectedDppLevel,
    solvedProblemKeysCache,
    solvedProblemKeysCache,
    user?.id,
  ]);

  const handleDppLevelChange = useCallback(
    (levelValue: string) => {
      if (hasGeneratedDppToday) {
        toast({
          title: "DPP Level Locked",
          description:
            "You have already generated a DPP for today. You cannot change the level until tomorrow.",
          variant: "destructive",
          className: "bg-red-600 text-white opacity-100 border-none",
        });
        return;
      }

      const newLevel =
        DPP_LEVELS_CONFIG.find((l) => l.level.toString() === levelValue) || // Match by string value from select
        DPP_LEVELS_CONFIG[0];
      setSelectedDppLevel(newLevel);
      setDppProblems(null);
      setIsDppGeneratedForSelectedLevelToday(false);
      setIsLoadedDppStale(false);
    },
    [
      setSelectedDppLevel,
      setDppProblems,
      setIsDppGeneratedForSelectedLevelToday,
      setIsLoadedDppStale,
      hasGeneratedDppToday, // Dependency added
      toast,
    ]
  );

  const isGenerateDppButtonDisabled = useMemo(() => {
    // Button should be disabled if loading, or if essential data isn't ready and not loading.
    // It should NOT be disabled if a DPP is already generated but the user wants to regenerate.
    return (
      isLoadingDpp ||
      isLoadingInitialData ||
      !userState.currentUser ||
      (allProblemsCache.length === 0 && !isLoadingInitialData) ||
      (isDppGeneratedForSelectedLevelToday && !isLoadedDppStale) ||
      (hasGeneratedDppToday && !isLoadedDppStale) // Disable if ANY DPP exists for today
    );
  }, [
    isLoadingDpp,
    isLoadingInitialData,
    userState.currentUser,
    allProblemsCache.length,
    isDppGeneratedForSelectedLevelToday,
    isLoadedDppStale,
    hasGeneratedDppToday,
  ]);

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
          {location.pathname !== "/dashboard" && (
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center text-gray-700 dark:text-dark-text dark:hover:bg-dark-blue/10 rounded-md p-1.5 lg:px-3 lg:py-1.5"
              title="Go to Dashboard"
            >
              <MdOutlineDashboard className="h-5 w-5 lg:mr-2" />{" "}
              <span className="hidden lg:inline">Dashboard</span>
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleAnalyticsClick}
            className="inline-flex items-center text-gray-700 dark:text-dark-text dark:hover:bg-dark-blue/10 rounded-md p-1.5 lg:px-3 lg:py-1.5"
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
                    Generate Set
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
                    <ProblemTable
                      problems={dppProblems.warmUpProblems}
                      title="Warm-up Problems"
                      titleColor="text-orange-600 dark:text-orange-400"
                      solvedProblemKeys={solvedProblemKeysCache}
                    />
                    <ProblemTable
                      problems={dppProblems.mainProblems}
                      title="Main Problems"
                      titleColor="text-teal-600 dark:text-teal-400"
                      solvedProblemKeys={solvedProblemKeysCache}
                    />
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
          {/* Clerk Authentication */}
          <SignedIn>
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          {/* Keep Dialog for Linking Handle (only if signed in but no handle) */}
          <Dialog
            open={isSignInDialogOpen}
            onOpenChange={setIsSignInDialogOpen}
          >
            <DialogContent className="sm:max-w-[380px] bg-white dark:bg-dark-bg dark:border-dark-border">
              <DialogHeader>
                <DialogTitle className="text-primary dark:text-dark-pink">
                  Link Codeforces Handle
                </DialogTitle>
                <DialogDescription className="dark:text-gray-400 text-xs sm:text-sm">
                  Enter your Codeforces handle to fetch your data.
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
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={!signInHandle.trim()}
                    className="w-full bg-primary hover:bg-primary/90 dark:bg-dark-purple dark:hover:bg-dark-purple/90 text-white dark:text-dark-text"
                  >
                    Link Handle
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
};

export default Header;
