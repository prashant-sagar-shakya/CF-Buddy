import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TagStats } from "@/services/analyticsHelpers"; // Adjust path
import { useThemeContext } from "@/context/ThemeContext"; // Adjust path

interface Props {
  data: TagStats[];
}

// Extended vibrant color palette - more options
const COLORS = [
  "#1E88E5", // Blue
  "#00ACC1", // Cyan
  "#43A047", // Green
  "#FFB300", // Amber
  "#F4511E", // Deep Orange
  "#AB47BC", // Purple
  "#EC407A", // Pink
  "#7E57C2", // Deep Purple
  "#42A5F5", // Light Blue
  "#26A69A", // Teal
  "#FFEE58", // Yellow
  "#EF5350", // Red
];

// Custom Tooltip for Pie Chart
const CustomPieTooltip: React.FC<any> = ({ active, payload }) => {
  const themeContext = useThemeContext ? useThemeContext() : { theme: "light" };
  const theme = themeContext.theme || "light";

  if (active && payload && payload.length) {
    const dataEntry = payload[0]; // Payload for pie charts is slightly different
    const tagName = dataEntry.name;
    const count = dataEntry.value;
    const percent = (dataEntry.percent * 100).toFixed(1);
    const barColor = dataEntry.payload.fill; // Color comes from the cell fill

    const bgColor =
      theme === "dark" ? "rgba(40, 42, 54, 0.98)" : "rgba(255, 255, 255, 0.98)";
    const textColorPrimary = theme === "dark" ? "#f8f8f2" : "#282a36";

    return (
      <div
        className="p-3 shadow-xl rounded-lg backdrop-blur-sm text-sm"
        style={{
          backgroundColor: bgColor,
          borderLeft: `4px solid ${barColor}`, // Use slice color for border
          color: textColorPrimary,
        }}
      >
        <p className="font-semibold mb-0.5" style={{ color: barColor }}>
          {tagName}
        </p>
        <p>
          Count: <span className="font-bold">{count}</span>
        </p>
        <p>
          Percent: <span className="font-bold">{percent}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const TagsSolvedPieChart: React.FC<Props> = ({ data }) => {
  const { theme } = useThemeContext(); // To potentially adjust label colors if needed

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">
        No tag data available.
      </p>
    );
  }
  // Limit tags for clarity, especially with legend below
  const topTags = data.slice(0, 12);

  return (
    <div className="p-1 rounded-lg bg-card dark:bg-neutral-800/30 shadow-sm h-[400px] sm:h-[450px]">
      {/* Slightly increased height to accommodate legend */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={topTags}
            cx="50%" // Center X
            cy="50%" // Center Y
            labelLine={false} // Generally cleaner without label lines
            // label={CustomPieLabel} // Use a custom label if needed inside slices
            outerRadius="80%" // Responsive Radius based on smaller dimension
            innerRadius="50%" // Donut chart effect, responsive
            fill="#8884d8" // Default fill (unused due to Cells)
            dataKey="value" // The value determining slice size
            nameKey="name" // Key used for legend/tooltip identification
            paddingAngle={1} // Small gap between slices
          >
            {topTags.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomPieTooltip />}
            animationDuration={150}
            wrapperStyle={{ outline: "none" }}
          />
          <Legend
            layout="horizontal" // Horizontal layout
            verticalAlign="bottom" // Position at the bottom
            align="center" // Center items horizontally
            wrapperStyle={{
              paddingTop: "20px", // Space above the legend
              fontSize: "11px",
              width: "95%", // Ensure legend items wrap if needed
              margin: "0 auto", // Help center the wrapper
              lineHeight: "1.4", // Adjust line height for wrapped items
            }}
            iconSize={10}
            // formatter to potentially shorten long tag names in legend
            formatter={(value) =>
              value.length > 18 ? `${value.substring(0, 16)}...` : value
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
export default TagsSolvedPieChart;