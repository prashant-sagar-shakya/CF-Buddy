import React, { useState, useEffect } from "react";
import UserTracker from "@/components/UserTracker";
import ProblemFilters from "@/components/ProblemFilters";
import SubmissionsList from "@/components/SubmissionsList";
import { useUserContext } from "@/context/UserContext";
import { FilterOptions } from "@/types/codeforces";

const Dashboard = () => {
  const { userState } = useUserContext();
  const [filters, setFilters] = useState<FilterOptions>({
    minRating: 800,
    maxRating: 3500,
    tags: [],
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="problem-card shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold mb-4 text-green-600 dark:text-dark-green">
          Track Codeforces Users
        </h2>
        <UserTracker />
      </div>

      {userState.currentUser && (
        <div className="problem-card shadow-sm border-l-4 border-l-primary hover:shadow-md">
          <h2 className="text-xl font-bold mb-4 text-primary dark:text-dark-purple">
            Signed in as{" "}
            <span className="text-green-600 dark:text-dark-green">
              {userState.currentUser}
            </span>
          </h2>
          <p className="text-muted-foreground dark:text-dark-text/80">
            <span className="px-2 py-0.5 bg-green-100 dark:bg-dark-green/50 text-green-700 dark:text-dark-green rounded-md mr-2 border border-green-200 dark:border-transparent">
              Green
            </span>
            Problems you've solved
            <span className="px-2 py-0.5 bg-red-100 dark:bg-dark-red/50 text-red-700 dark:text-dark-red rounded-md mx-2 border border-red-200 dark:border-transparent">
              Red
            </span>
            Problems you've attempted but failed
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <ProblemFilters
              filters={filters}
              setFilters={setFilters}
              availableTags={availableTags}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <SubmissionsList
            handles={userState.trackedUsers}
            filters={filters}
            setAvailableTags={setAvailableTags}
          />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
