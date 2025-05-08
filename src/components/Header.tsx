import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUserContext } from "@/context/UserContext";
import { useThemeContext } from "@/context/ThemeContext";
import {
  CodeIcon,
  LogOut,
  UserIcon,
  Moon,
  Sun,
  BarChart3Icon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { userState, signIn, signOut } = useUserContext();
  const { theme, toggleTheme } = useThemeContext();
  const [handle, setHandle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handle.trim()) {
      const success = await signIn(handle.trim());
      if (success) {
        setHandle("");
        setIsDialogOpen(false);
      }
    }
  };

  const handleAnalyticsClick = () => {
    if (userState.currentUser) {
      navigate(`/analytics/${userState.currentUser}`);
    } else {
      navigate("/analytics");
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-10 bg-white/90 dark:bg-code-bg/80 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border py-3 px-4 sm:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div
          onClick={handleLogoClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleLogoClick();
            }
          }}
          className="flex items-center space-x-2 cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Go to homepage"
        >
          <CodeIcon className="h-8 w-8 text-primary dark:text-dark-purple" />
          <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-dark-purple">
            CF
            <span className="text-blue-400 dark:text-dark-blue">-</span>
            <span className="text-green-600 dark:text-dark-pink">Buddy</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-600 dark:text-dark-blue hover:bg-gray-100 dark:hover:bg-dark-blue/10 rounded-full"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleAnalyticsClick}
            className="inline-flex items-center text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-blue/10 rounded-md p-1.5 lg:px-3 lg:py-1.5"
            aria-label="View Analytics"
            title="Analytics"
          >
            <BarChart3Icon className="h-5 w-5 lg:mr-2" />
            <span className="hidden lg:inline">Analytics</span>
          </Button>

          {userState.currentUser ? (
            <div className="flex items-center space-x-1 sm:space-x-2 bg-green-50 dark:bg-dark-green/20 px-2 sm:px-3 py-1 rounded-full">
              <UserIcon
                className="block sm:hidden h-5 w-5 text-green-700 dark:text-dark-green"
                title={userState.currentUser}
                aria-label={`User: ${userState.currentUser}`}
              />
              <span
                className="hidden sm:inline font-semibold text-green-700 dark:text-dark-green terminal-text truncate max-w-[100px] sm:max-w-[150px]"
                title={userState.currentUser}
              >
                {userState.currentUser}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-red-500 dark:text-dark-red hover:text-red-600 hover:bg-red-50 dark:hover:text-dark-red/80 dark:hover:bg-dark-red/10 rounded-full"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-primary dark:border-dark-purple hover:bg-primary/10 dark:hover:bg-dark-purple/20 h-8 px-2 sm:h-9 sm:px-4"
                >
                  <UserIcon className="mr-0 h-4 w-4 sm:mr-2" />
                  <span className="sm:inline">Sign In</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-dark-bg dark:border-dark-border">
                <DialogHeader>
                  <DialogTitle className="text-primary dark:text-dark-pink">
                    Sign in
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                      Enter your Codeforces handle
                    </label>
                    <Input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="your_cf_handle"
                      className="bg-gray-50 dark:bg-dark-card border-gray-300 dark:border-dark-blue focus-visible:ring-primary dark:focus-visible:ring-dark-purple"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-primary dark:bg-dark-purple hover:bg-primary/90 dark:hover:bg-dark-purple/90"
                      disabled={!handle.trim()}
                    >
                      Sign In
                    </Button>
                  </div>
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