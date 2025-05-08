// components/charts/ActivityHeatmapChart.tsx
import React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css"; // Import styles
import { ActivityPoint } from "@/services/analyticsHelpers"; // Adjust path
import { subYears, formatISO, parseISO } from "date-fns";
import { Tooltip as ReactTooltip } from "react-tooltip"; // If you have this from react-tooltip library

interface Props {
  data: ActivityPoint[]; // Expects [{ date: 'YYYY-MM-DD', count: N, level: L }, ...]
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

  // Map your ActivityPoint level to a CSS class for coloring
  const classForValue = (value: ActivityPoint | null) => {
    if (!value || value.count === 0) {
      return "color-empty";
    }
    return `color-github-${value.level || 0}`; // Use level or default to 0
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
      {/* Basic CSS for heatmap colors (add to your global CSS or component-specific styles) */}
      <style>{`
        .react-calendar-heatmap .color-empty { fill: #ebedf0; }
        .react-calendar-heatmap .color-github-0 { fill: #ebedf0; } /* For days with 0 if explicitly mapped */
        .react-calendar-heatmap .color-github-1 { fill: #9be9a8; }
        .react-calendar-heatmap .color-github-2 { fill: #40c463; }
        .react-calendar-heatmap .color-github-3 { fill: #30a14e; }
        .react-calendar-heatmap .color-github-4 { fill: #216e39; }
        .react-calendar-heatmap text { font-size: 9px; fill: #586069; }
      `}</style>
      <CalendarHeatmap
        startDate={oneYearAgo}
        endDate={today}
        values={data} // data should be [{ date: 'YYYY-MM-DD', count: X, level: Y }, ...]
        classForValue={classForValue}
        tooltipDataAttrs={tooltipDataAttrs}
        showWeekdayLabels={true}
        weekdayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
      />
      <ReactTooltip id="heatmap-tooltip" place="top" effect="solid" />
    </div>
  );
};
export default ActivityHeatmapChart;
