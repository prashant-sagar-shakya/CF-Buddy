import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getDppByDate, getCalendarData } from "@/services/dppService";
import { useUser } from "@clerk/clerk-react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import "react-day-picker/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ProblemTable from "@/components/ProblemTable";
import { DppProblemEntry } from "@/services/dppHelpers";

const DPPCalendar = () => {
  const { user } = useUser();
  const userId = user?.id;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dppDetails, setDppDetails] = useState<{
    mainProblems: DppProblemEntry[];
    warmUpProblems: DppProblemEntry[];
    level: number;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const { data: calendarData } = useQuery({
    queryKey: ["dppCalendar", userId],
    queryFn: () => getCalendarData(userId!),
    enabled: !!userId,
  });

  const solvedDays =
    calendarData
      ?.filter((d: any) => d.isFullySolved)
      .map((d: any) => new Date(d.date)) || [];

  const attemptedDays =
    calendarData
      ?.filter((d: any) => !d.isFullySolved)
      .map((d: any) => new Date(d.date)) || [];

  const modifiers = {
    solved: solvedDays,
    attempted: attemptedDays,
  };

  const modifiersStyles = {
    solved: { color: "green", fontWeight: "bold" },
    attempted: { color: "red", fontWeight: "bold" },
  };

  const renderDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const entry = calendarData?.find((d: any) => d.date === dateStr);

    if (!entry) return <div>{day.getDate()}</div>;

    if (entry.isFullySolved) {
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          {day.getDate()}
          <CheckCircle2 className="absolute bottom-0 right-0 w-3 h-3 text-green-500" />
        </div>
      );
    } else {
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          {day.getDate()}
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </div>
      );
    }
  };

  const [solvedKeys, setSolvedKeys] = useState<Set<string>>(new Set());

  const handleDayClick = async (day: Date) => {
    if (!userId) return;
    setSelectedDate(day);
    setIsDialogOpen(true);
    setIsLoadingDetails(true);
    setDppDetails(null);
    setSolvedKeys(new Set());

    try {
      const dateStr = format(day, "yyyy-MM-dd");
      const data = await getDppByDate(userId, dateStr);
      if (data) {
        const mainProblems = data.problems.filter(
          (p: any) => p.category === "main"
        );
        const warmUpProblems = data.problems.filter(
          (p: any) => p.category === "warmup"
        );

        const newSolvedKeys = new Set<string>();
        data.problems.forEach((p: any) => {
          if (p.solved) newSolvedKeys.add(`${p.contestId}-${p.index}`);
        });
        setSolvedKeys(newSolvedKeys);

        setDppDetails({
          mainProblems,
          warmUpProblems,
          level: data.level,
        });
      } else {
        setDppDetails(null);
      }
    } catch (error) {
      console.error("Failed to fetch DPP details", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
      <h3 className="text-lg font-semibold mb-4">DPP Streak</h3>
      <DayPicker
        mode="single"
        fromDate={new Date(new Date().getFullYear(), 0, 1)}
        toDate={new Date()}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        components={{
          DayContent: (props) => renderDay(props.date),
        }}
        onDayClick={handleDayClick}
        className="mx-auto"
        classNames={{
          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-700 hover:text-gray-900 rounded-md transition-colors",
          day_today: "bg-accent text-accent-foreground font-bold",
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              DPP for{" "}
              {selectedDate ? format(selectedDate, "MMMM do, yyyy") : ""}
            </DialogTitle>
            <DialogDescription>
              {dppDetails
                ? `Level ${dppDetails.level}`
                : "Daily Practice Problems"}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : dppDetails ? (
            <div className="space-y-6">
              <ProblemTable
                problems={dppDetails.warmUpProblems}
                title="Warm-up Problems"
                titleColor="text-orange-600 dark:text-orange-400"
                solvedProblemKeys={solvedKeys}
              />
              <ProblemTable
                problems={dppDetails.mainProblems}
                title="Main Problems"
                titleColor="text-teal-600 dark:text-teal-400"
                solvedProblemKeys={solvedKeys}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No DPP generated for this date.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DPPCalendar;
