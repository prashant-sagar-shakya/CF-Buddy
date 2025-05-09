import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { ProblemStats } from "@/services/analyticsHelpers";
import { useThemeContext } from "@/context/ThemeContext";

export const RATING_THRESHOLDS = [
  {
    rating: 0,
    name: "Newbie",
    color: "#A0A0A0",
    darkColor: "#a19d9d",
    textColor: "#000000",
  },
  {
    rating: 1200,
    name: "Pupil",
    color: "#55D455",
    darkColor: "#3d893d",
    textColor: "#000000",
  },
  {
    rating: 1400,
    name: "Specialist",
    color: "#55C0A0",
    darkColor: "#467f6c",
    textColor: "#000000",
  },
  {
    rating: 1600,
    name: "Expert",
    color: "#8888EE",
    darkColor: "#4e4e7c",
    textColor: "#000000",
  },
  {
    rating: 1900,
    name: "Candidate Master",
    color: "#E566E5",
    darkColor: "#944f94",
    textColor: "#000000",
  },
  {
    rating: 2100,
    name: "Master",
    color: "#E8B068",
    darkColor: "#99713d",
    textColor: "#000000",
  },
  {
    rating: 2300,
    name: "Int. Master",
    color: "#EEA030",
    darkColor: "#a2691e",
    textColor: "#000000",
  },
  {
    rating: 2400,
    name: "Grandmaster",
    color: "#F06060",
    darkColor: "#914242",
    textColor: "#000000",
  },
  {
    rating: 2600,
    name: "International Grandmaster",
    color: "#E62E2E",
    darkColor: "#9d1f1f",
    textColor: "#FFFFFF",
  },
  {
    rating: 3000,
    name: "Legendary GM",
    color: "#A80000",
    darkColor: "#780101",
    textColor: "#FFFFFF",
  },
];

export const getRank = (rating: number): (typeof RATING_THRESHOLDS)[0] => {
  for (let i = RATING_THRESHOLDS.length - 1; i >= 0; i--) {
    if (rating >= RATING_THRESHOLDS[i].rating) {
      return RATING_THRESHOLDS[i];
    }
  }
  return RATING_THRESHOLDS[0];
};

interface Props {
  data: ProblemStats[];
}

const CustomBarTooltip: React.FC<any> = ({ active, payload, label }) => {
  const themeContext = useThemeContext ? useThemeContext() : { theme: "light" };
  const theme = themeContext.theme || "light";

  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as ProblemStats;
    const ratingValue = dataPoint.rating;
    const problemsCount = payload[0].value;

    const rank = getRank(ratingValue);
    const rankColor = theme === "dark" ? rank.darkColor : rank.color;
    const bgColor =
      theme === "dark" ? "rgba(40, 42, 54, 0.98)" : "rgba(255, 255, 255, 0.98)";
    const textColorPrimary = theme === "dark" ? "#f8f8f2" : "#282a36";

    return (
      <div
        className="p-3 shadow-xl rounded-lg backdrop-blur-sm"
        style={{
          backgroundColor: bgColor,
          borderLeft: `4px solid ${rankColor}`,
          color: textColorPrimary,
        }}
      >
        <p className="font-semibold text-sm mb-1">
          Rating:{" "}
          <span style={{ color: rankColor, fontWeight: "bold" }}>
            {ratingValue}
          </span>{" "}
          ({rank.name})
        </p>
        <p className="text-sm">
          Problems Solved: <span className="font-bold">{problemsCount}</span>
        </p>
      </div>
    );
  }
  return null;
};

const VerticalBarLabel: React.FC<any> = (props) => {
  const { x, y, width, height, index, payload } = props;

  if (!payload || typeof payload.rating !== "number") {
    return null;
  }

  const ratingValue = payload.rating;
  const themeContext = useThemeContext ? useThemeContext() : { theme: "light" };
  const theme = themeContext.theme || "light";

  const rank = getRank(ratingValue);
  const barBgColor = theme === "dark" ? rank.darkColor : rank.color;

  const isDarkBg = (colorHex: string) => {
    if (!colorHex || colorHex.length < 6) return false;
    const hex = colorHex.replace("#", "");
    let r: number, g: number, b: number;
    if (hex.length === 3) {
      r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
      g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
      b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      return false; // Invalid hex length
    }
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 140;
  };

  const labelColor = isDarkBg(barBgColor) ? "#FFFFFF" : "#000000";
  const ratingString = ratingValue.toString();
  const labelFontSize = Math.max(
    8,
    Math.min(12, width - 6, height / (ratingString.length * 0.7 + 3))
  );
  const estimatedTextHeight = ratingString.length * labelFontSize * 0.6;
  const showLabel =
    height > Math.max(20, estimatedTextHeight + 10) &&
    width > 12 &&
    labelFontSize >= 8;

  if (!showLabel) {
    return null;
  }

  const textContent = ratingString;
  const textX = x + width / 2;
  const textY = y + height - 7;

  return (
    <text
      x={textX}
      y={textY}
      transform={`rotate(-90, ${textX}, ${textY})`}
      fill={labelColor}
      fontSize={labelFontSize}
      fontWeight="bold"
      textAnchor="end"
      dominantBaseline="middle"
    >
      {textContent}
    </text>
  );
};

const ProblemRatingsBarChart: React.FC<Props> = ({ data }) => {
  const { theme } = useThemeContext();

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">
        No problem rating data available.
      </p>
    );
  }

  const sortedData = [...data].sort((a, b) => a.rating - b.rating);

  const gridStrokeColor =
    theme === "dark" ? "rgba(100, 116, 139, 0.2)" : "rgba(203, 213, 225, 0.3)";
  const axisTextColor = theme === "dark" ? "#CBD5E1" : "#475569";
  const axisLineColor = theme === "dark" ? "#475569" : "#CBD5E1";

  return (
    <div className="p-1 rounded-lg bg-card dark:bg-neutral-800/30 shadow-sm h-[350px] sm:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          barGap={2}
          barCategoryGap="15%"
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke={gridStrokeColor}
            strokeOpacity={0.7}
          />
          <XAxis
            dataKey="rating"
            axisLine={{ stroke: axisLineColor, strokeWidth: 1 }}
            tickLine={false}
            tick={false}
            height={10}
          />
          <YAxis
            allowDecimals={false}
            width={45}
            stroke={axisLineColor}
            tick={{ fontSize: 11, fill: axisTextColor, fontWeight: 500 }}
            dx={-3}
            axisLine={{ stroke: axisLineColor, strokeWidth: 1 }}
            tickLine={{ stroke: axisLineColor, strokeWidth: 1 }}
          />
          <Tooltip
            content={<CustomBarTooltip />}
            cursor={{
              fill:
                theme === "dark"
                  ? "rgba(100,116,139,0.1)"
                  : "rgba(203,213,225,0.2)",
            }}
            wrapperStyle={{ outline: "none" }}
            animationDuration={150}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={30}
            iconSize={12}
            formatter={(value) => (
              <span className="text-xs font-semibold text-foreground dark:text-neutral-300 ml-1">
                {value}
              </span>
            )}
          />
          <Bar dataKey="count" name="Problems Solved" radius={[4, 4, 0, 0]}>
            {sortedData.map((entry, index) => {
              const rank = getRank(entry.rating);
              const barColor = theme === "dark" ? rank.darkColor : rank.color;
              return <Cell key={`cell-${index}`} fill={barColor} />;
            })}
            <LabelList dataKey="rating" content={<VerticalBarLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default ProblemRatingsBarChart;
