import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TagStats } from "@/services/analyticsHelpers";
import { useThemeContext } from "@/context/ThemeContext";

interface Props {
  data: TagStats[];
}

const COLORS = [
  "#1E88E5",
  "#00ACC1",
  "#43A047",
  "#FFB300",
  "#F4511E",
  "#AB47BC",
  "#EC407A",
  "#7E57C2",
  "#42A5F5",
  "#26A69A",
  "#FFEE58",
  "#EF5350",
];

interface CustomPieTooltipProps {
  active?: boolean;
  payload?: any[];
  totalSum: number;
}

const CustomPieTooltip: React.FC<CustomPieTooltipProps> = ({
  active,
  payload,
  totalSum,
}) => {
  const themeContext = useThemeContext ? useThemeContext() : { theme: "light" };
  const theme = themeContext.theme || "light";

  if (active && payload && payload.length) {
    const dataEntry = payload[0];
    const tagName = dataEntry.name;
    const count = dataEntry.value;
    const barColor = dataEntry.payload.fill;

    let percentDisplay = "0.0";
    if (totalSum > 0 && count > 0) {
      percentDisplay = ((count / totalSum) * 100).toFixed(1);
    } else if (dataEntry.percent && !isNaN(dataEntry.percent)) {
      percentDisplay = (dataEntry.percent * 100).toFixed(1);
    }

    const bgColor =
      theme === "dark" ? "rgba(40, 42, 54, 0.98)" : "rgba(255, 255, 255, 0.98)";
    const textColorPrimary = theme === "dark" ? "#f8f8f2" : "#282a36";

    return (
      <div
        className="p-3 shadow-xl rounded-lg backdrop-blur-sm text-sm"
        style={{
          backgroundColor: bgColor,
          borderLeft: `4px solid ${barColor}`,
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
          Percent: <span className="font-bold">{percentDisplay}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const TagsSolvedPieChart: React.FC<Props> = ({ data }) => {
  const { theme } = useThemeContext();

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">
        No tag data available.
      </p>
    );
  }

  const topTags = data.slice(0, 12);
  const totalSum = topTags.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="p-1 rounded-lg bg-card dark:bg-neutral-800/30 shadow-sm h-[400px] sm:h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={topTags}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius="80%"
            innerRadius="50%"
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            paddingAngle={1}
          >
            {topTags.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomPieTooltip totalSum={totalSum} />}
            animationDuration={150}
            wrapperStyle={{ outline: "none" }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "11px",
              width: "95%",
              margin: "0 auto",
              lineHeight: "1.4",
            }}
            iconSize={10}
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
