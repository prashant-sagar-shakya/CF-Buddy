import React, { useState, useEffect } from "react";
import UserTracker from "@/components/UserTracker";
import ProblemFilters from "@/components/ProblemFilters";
import SubmissionsList from "@/components/SubmissionsList";
import { useUserContext } from "@/context/UserContext";
import { FilterOptions } from "@/types/codeforces";
import DPPCalendar from "@/components/DPPCalendar";

import { useUser } from "@clerk/clerk-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { userState, linkHandle, unlinkHandle } = useUserContext();
  const { user } = useUser();
  const navigate = useNavigate();
  const [analyticsHandle, setAnalyticsHandle] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    minRating: 800,
    maxRating: 3500,
    tags: [],
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const handleSaveHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (analyticsHandle.trim()) {
      const success = await linkHandle(analyticsHandle.trim());
      if (success) {
        setAnalyticsHandle("");
      }
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="problem-card shadow-sm hover:shadow-md transition-shadow p-6 bg-card rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-green-600 dark:text-dark-green">
          Track Codeforces Users
        </h2>
        <UserTracker />
      </div>

      {user && (
        <div className="problem-card shadow-sm border-l-4 border-l-primary hover:shadow-md pl-[10px] pr-6 py-6 bg-card rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2 text-primary dark:text-dark-purple">
              Signed in as{" "}
              <span className="text-green-600 dark:text-dark-green">
                {user.fullName || user.firstName || user.username}
              </span>
            </h2>
            <p className="text-muted-foreground dark:text-dark-text/80 text-sm">
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

          {userState.currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-gray-700 dark:text-gray-200">
                {userState.currentUser}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => unlinkHandle()}
                className="text-muted-foreground hover:text-primary"
              >
                Change
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSaveHandle}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <Input
                type="text"
                placeholder="Enter Your Handle"
                value={analyticsHandle}
                onChange={(e) => setAnalyticsHandle(e.target.value)}
                className="h-9 w-full md:w-[200px] bg-background"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!analyticsHandle.trim()}
              >
                Save
              </Button>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-6">
            <DPPCalendar />
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
