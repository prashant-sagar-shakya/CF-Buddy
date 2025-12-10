import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { UserState } from "@/types/codeforces";
import { validateHandle } from "@/services/codeforcesApi";
import { toast } from "@/components/ui/use-toast";

interface UserContextProps {
  userState: UserState;
  linkHandle: (handle: string) => Promise<boolean>;
  unlinkHandle: () => void;
  addTrackedUser: (handle: string) => Promise<boolean>;
  removeTrackedUser: (handle: string) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [userState, setUserState] = useState<UserState>(() => {
    // Load user state from localStorage on initial render
    const savedState = localStorage.getItem("codeforces-user-state");
    return savedState
      ? JSON.parse(savedState)
      : { currentUser: null, trackedUsers: [] };
  });

  // Save to localStorage whenever userState changes
  useEffect(() => {
    localStorage.setItem("codeforces-user-state", JSON.stringify(userState));
  }, [userState]);

  // Link a Codeforces handle
  const linkHandle = async (handle: string): Promise<boolean> => {
    try {
      const isValid = await validateHandle(handle);
      if (isValid) {
        setUserState((prev) => ({
          ...prev,
          currentUser: handle,
          trackedUsers: prev.trackedUsers.includes(handle)
            ? prev.trackedUsers
            : [...prev.trackedUsers, handle],
        }));
        toast({
          title: "Handle Linked",
          description: `Linked Codeforces handle: ${handle}`,
        });
        return true;
      } else {
        toast({
          title: "Invalid handle",
          description: "This Codeforces handle doesn't exist",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error linking handle",
        description: "Failed to verify Codeforces handle",
        variant: "destructive",
      });
      return false;
    }
  };

  // Unlink the current user
  const unlinkHandle = () => {
    setUserState((prev) => ({ ...prev, currentUser: null }));
    toast({
      title: "Handle Unlinked",
      description: "Codeforces handle unlinked successfully",
    });
  };

  // Add a user to track
  const addTrackedUser = async (handle: string): Promise<boolean> => {
    if (userState.trackedUsers.includes(handle)) {
      toast({
        title: "Already tracking",
        description: `Already tracking ${handle}`,
      });
      return true;
    }

    try {
      const isValid = await validateHandle(handle);
      if (isValid) {
        setUserState((prev) => ({
          ...prev,
          trackedUsers: [...prev.trackedUsers, handle],
        }));
        toast({
          title: "User added",
          description: `Now tracking ${handle}`,
        });
        return true;
      } else {
        toast({
          title: "Invalid handle",
          description: "This Codeforces handle doesn't exist",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error adding user",
        description: "Failed to verify Codeforces handle",
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove a user from tracking
  const removeTrackedUser = (handle: string) => {
    setUserState((prev) => ({
      ...prev,
      trackedUsers: prev.trackedUsers.filter((u) => u !== handle),
      currentUser: prev.currentUser === handle ? null : prev.currentUser,
    }));
    toast({
      title: "User removed",
      description: `No longer tracking ${handle}`,
    });
  };

  return (
    <UserContext.Provider
      value={{
        userState,
        linkHandle,
        unlinkHandle,
        addTrackedUser,
        removeTrackedUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
