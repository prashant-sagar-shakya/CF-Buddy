import React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { ActivityPoint } from "@/services/analyticsHelpers";
import { subYears, formatISO, parseISO } from "date-fns";
import { Tooltip as ReactTooltip } from "react-tooltip";

interface Props {
  data: ActivityPoint[];
}

const ActivityHeatmapChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No activity data available.
      </p>
    );
  }

  const today = new Date();
  const oneYearAgo = subYears(today, 1);

  const classForValue = (value: ActivityPoint | null) => {
    if (!value || value.count === 0) {
      return "color-empty";
    }
    return `color-github-${value.level || 0}`;
  };

  const tooltipDataAttrs = (value: ActivityPoint) => {
    if (!value || !value.date) return null;
    return {
      "data-tooltip-id": "heatmap-tooltip",
      "data-tooltip-content": `${formatISO(parseISO(value.date), {
        representation: "date",
      })}: ${value.count} submissions`,
    };
  };

  return (
    <div className="overflow-x-auto p-2 bg-card rounded-md shadow">
      <style>{`
        .react-calendar-heatmap .color-empty { fill: #ebedf0; }
        .react-calendar-heatmap .color-github-0 { fill: #ebedf0; }
        .react-calendar-heatmap .color-github-1 { fill: #9be9a8; }
        .react-calendar-heatmap .color-github-2 { fill: #40c463; }
        .react-calendar-heatmap .color-github-3 { fill: #30a14e; }
        .react-calendar-heatmap .color-github-4 { fill: #216e39; }
        .react-calendar-heatmap text { font-size: 9px; fill: #586069; }
        .dark .react-calendar-heatmap .color-empty { fill: #2d333b; }
        .dark .react-calendar-heatmap .color-github-0 { fill: #2d333b; }
        .dark .react-calendar-heatmap .color-github-1 { fill: #0e4429; }
        .dark .react-calendar-heatmap .color-github-2 { fill: #006d32; }
        .dark .react-calendar-heatmap .color-github-3 { fill: #26a641; }
        .dark .react-calendar-heatmap .color-github-4 { fill: #39d353; }
        .dark .react-calendar-heatmap text { fill: #adbac7; }
        #heatmap-tooltip.dark-mode {
          background-color: #333;
          color: #fff;
        }
        #heatmap-tooltip.light-mode {
          background-color: #fff;
          color: #333;
        }
      `}</style>
      <CalendarHeatmap
        startDate={oneYearAgo}
        endDate={today}
        values={data}
        classForValue={classForValue}
        tooltipDataAttrs={tooltipDataAttrs}
        showWeekdayLabels={true}
        weekdayLabels={["S", "M", "T", "W", "T", "F", "S"]}
      />
      <ReactTooltip id="heatmap-tooltip" place="top" effect="solid" />
    </div>
  );
};

export default ActivityHeatmapChart;
