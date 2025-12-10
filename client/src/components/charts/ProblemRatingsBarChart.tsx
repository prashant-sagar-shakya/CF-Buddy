"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { useThemeContext } from "@/context/ThemeContext";
import tinycolor from "tinycolor2";

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

export const getRank = (rating: number) => {
  for (let i = RATING_THRESHOLDS.length - 1; i >= 0; i--) {
    if (rating >= RATING_THRESHOLDS[i].rating) return RATING_THRESHOLDS[i];
  }
  return RATING_THRESHOLDS[0];
};

const CustomBarTooltip = ({ active, payload }) => {
  const { theme } = useThemeContext();
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const rank = getRank(dataPoint.rating);
    const rankColor = theme === "dark" ? rank.darkColor : rank.color;
    const bgColor =
      theme === "dark" ? "rgba(40, 42, 54, 0.98)" : "rgba(255, 255, 255, 0.98)";
    const textColor = theme === "dark" ? "#f8f8f2" : "#282a36";
    return (
      <div
        className="p-3 shadow-xl rounded-lg backdrop-blur-sm"
        style={{
          backgroundColor: bgColor,
          borderLeft: `4px solid ${rankColor}`,
          color: textColor,
        }}
      >
        <p className="font-semibold text-sm mb-1">
          Rating:{" "}
          <span style={{ color: rankColor, fontWeight: "bold" }}>
            {dataPoint.rating}
          </span>{" "}
          ({rank.name})
        </p>
        <p className="text-sm">
          Problems Solved: <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const SmartBarLabel = (props) => {
  const { x, y, width, height, value, payload } = props;
  if (!payload || typeof payload.rating !== "number" || !value || value === 0)
    return null;
  const { theme } = useThemeContext();
  const rank = getRank(payload.rating);
  const barBgColor = theme === "dark" ? rank.darkColor : rank.color;
  const luminance = tinycolor(barBgColor).getLuminance();
  const labelColor = luminance < 0.5 ? "#FFFFFF" : "#000000";
  const fontSize = Math.max(8, Math.min(10, width - 5));
  const textX = x + width / 2;
  const textY = height > fontSize + 6 ? y + height - fontSize / 2 - 5 : y - 6;
  return (
    <text
      x={textX}
      y={textY}
      fill={labelColor}
      fontSize={fontSize}
      fontWeight="bold"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
};

const ProblemRatingsBarChart = ({ data }) => {
  const { theme } = useThemeContext();
  if (!data || data.length === 0)
    return (
      <p className="text-center text-muted-foreground py-10">
        No problem rating data available.
      </p>
    );

  const sortedData = [...data].sort((a, b) => a.rating - b.rating);
  const gridStrokeColor =
    theme === "dark" ? "rgba(100, 116, 139, 0.2)" : "rgba(203, 213, 225, 0.3)";
  const axisTextColor = theme === "dark" ? "#CBD5E1" : "#475569";
  const axisLineColor = theme === "dark" ? "#475569" : "#CBD5E1";

  return (
      <div className="h-[380px] sm:h-[420px]">

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 30, right: 20, left: 10, bottom: 15 }}
          barGap={2}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
          <XAxis
            dataKey="rating"
            axisLine={{ stroke: axisLineColor }}
            tick={{ fontSize: 10, fill: axisTextColor }}
            height={20}
          />
          <YAxis
            allowDecimals={false}
            axisLine={{ stroke: axisLineColor }}
            tick={{ fontSize: 10, fill: axisTextColor }}
            width={40}
          />
          <Tooltip
            content={<CustomBarTooltip />}
            cursor={{
              fill:
                theme === "dark"
                  ? "rgba(100,116,139,0.1)"
                  : "rgba(203,213,225,0.2)",
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {sortedData.map((entry, index) => {
              const rank = getRank(entry.rating);
              const barColor = theme === "dark" ? rank.darkColor : rank.color;
              return <Cell key={`cell-${index}`} fill={barColor} />;
            })}
            <LabelList dataKey="count" content={<SmartBarLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProblemRatingsBarChart;
