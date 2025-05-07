
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/context/UserContext";
import { PlusCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const UserTracker = () => {
  const { userState, addTrackedUser, removeTrackedUser } = useUserContext();
  const [newHandle, setNewHandle] = useState("");

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newHandle.trim()) {
      const success = await addTrackedUser(newHandle.trim());
      if (success) {
        setNewHandle("");
      }
    }
  };

  // Filter out the current user from the displayed tracked users
  const displayedUsers = userState.trackedUsers.filter(handle => handle !== userState.currentUser);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleAddUser} className="flex-1 flex gap-2">
          <Input
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            placeholder="Add Codeforces handle to track"
            className="flex-1 bg-white border-gray-300 focus-visible:ring-primary dark:bg-dark-card dark:border-dark-blue dark:focus-visible:ring-dark-purple"
          />
          <Button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white dark:bg-dark-purple dark:hover:bg-dark-purple/90"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add
          </Button>
        </form>
      </div>
      
      {displayedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {displayedUsers.map(handle => (
            <Badge 
              key={handle} 
              variant="outline" 
              className="px-3 py-1 border-primary/30 bg-primary/5 dark:border-dark-blue dark:bg-dark-blue/10 flex items-center gap-1 hover-scale"
            >
              <span className="text-gray-800 dark:text-dark-text">
                {handle}
              </span>
              <button 
                onClick={() => removeTrackedUser(handle)} 
                className="text-red-500 hover:text-red-600 dark:text-dark-red dark:hover:text-dark-red/80 ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserTracker;
