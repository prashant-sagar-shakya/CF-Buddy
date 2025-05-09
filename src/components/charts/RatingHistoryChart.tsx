import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  DotProps,
} from "recharts";
import { RatingDataPoint } from "@/services/analyticsHelpers";
import { format, differenceInMonths } from "date-fns";
import { useThemeContext } from "@/context/ThemeContext";

function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useLayoutEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    if (typeof window !== "undefined") {
      handleResize();
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

const MOBILE_BREAKPOINT = 768;
const DESKTOP_CHART_HEIGHT = 400;
const MOBILE_CHART_HEIGHT = 320;
const DESKTOP_CHART_MIN_WIDTH = 600;
const MOBILE_CHART_MIN_WIDTH = 480;
const DESKTOP_MONTH_MULTIPLIER = 90;
const MOBILE_MONTH_MULTIPLIER = 70;
const DESKTOP_BASE_WIDTH_OFFSET = 250;
const MOBILE_BASE_WIDTH_OFFSET = 180;
const DESKTOP_CHART_MARGIN = { top: 25, right: 50, left: 25, bottom: 35 };
const MOBILE_CHART_MARGIN = { top: 20, right: 20, left: 10, bottom: 30 };
const DESKTOP_XAXIS_TICK_FONT_SIZE = 12;
const MOBILE_XAXIS_TICK_FONT_SIZE = 10;
const DESKTOP_XAXIS_MIN_TICK_GAP = 70;
const MOBILE_XAXIS_MIN_TICK_GAP = 50;
const DESKTOP_XAXIS_DY = 12;
const MOBILE_XAXIS_DY = 10;
const DESKTOP_YAXIS_WIDTH = 60;
const MOBILE_YAXIS_WIDTH = 45;
const DESKTOP_YAXIS_TICK_FONT_SIZE = 12;
const MOBILE_YAXIS_TICK_FONT_SIZE = 10;
const DESKTOP_YAXIS_DX = -7;
const MOBILE_YAXIS_DX = -5;
const DESKTOP_DOT_RADIUS = 5.5;
const MOBILE_DOT_RADIUS = 4;
const DESKTOP_DOT_STROKE_WIDTH = 2.5;
const MOBILE_DOT_STROKE_WIDTH = 2;
const DESKTOP_ACTIVE_DOT_RADIUS = 9;
const MOBILE_ACTIVE_DOT_RADIUS = 7;
const DESKTOP_ACTIVE_DOT_STROKE_WIDTH = 2.5;
const MOBILE_ACTIVE_DOT_STROKE_WIDTH = 2;
const DESKTOP_LEGEND_HEIGHT = 45;
const MOBILE_LEGEND_HEIGHT = 35;
const DESKTOP_LEGEND_PADDING = { paddingBottom: "20px", paddingTop: "5px" };
const MOBILE_LEGEND_PADDING = { paddingBottom: "15px", paddingTop: "0px" };

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
    name: "International Master",
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
    name: "Int. Grandmaster",
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
  data: RatingDataPoint[];
  handle: string;
}

const INITIAL_CONTEST_NAMES_TO_FILTER = [
  "Initial Rating",
  "Provisional Rating",
];

const CustomTooltip: React.FC<any> = ({
  active,
  payload,
  label,
  handleUsername,
}) => {
  const themeContext = useThemeContext ? useThemeContext() : { theme: "light" };
  const theme = themeContext.theme || "light";

  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as RatingDataPoint;
    const rank = getRank(dataPoint.rating);
    const rankColor = theme === "dark" ? rank.darkColor : rank.color;
    const bgColor =
      theme === "dark" ? "rgba(30, 32, 42, 0.97)" : "rgba(250, 250, 255, 0.97)";
    const textColorPrimary = theme === "dark" ? "#F0F0F0" : "#1E1E2E";
    const textColorSecondary = theme === "dark" ? "#A0A0B0" : "#5E5E6E";
    const borderColor = rankColor;

    return (
      <div
        className="p-3 shadow-2xl rounded-lg backdrop-blur-sm text-xs sm:text-sm"
        style={{
          backgroundColor: bgColor,
          border: `2px solid ${borderColor}`,
          color: textColorPrimary,
        }}
      >
        <p className="font-bold mb-1 sm:mb-1.5">
          {format(new Date(label * 1000), "MMM d, yy, h:mm a")}
        </p>
        <div className="flex items-baseline mb-0.5 sm:mb-1">
          <span
            className="font-extrabold text-lg sm:text-xl"
            style={{ color: rankColor }}
          >
            {dataPoint.rating}
          </span>
          <span
            className="ml-1.5 sm:ml-2 text-xs sm:text-sm opacity-100"
            style={{ color: textColorSecondary }}
          >
            ({handleUsername})
          </span>
        </div>
        <p
          className="text-2xs sm:text-xs font-bold tracking-wider"
          style={{ color: rankColor }}
        >
          RANK: {rank.name.toUpperCase()}
        </p>
        {dataPoint.contestName && (
          <p
            className="mt-1 sm:mt-1.5 text-2xs sm:text-xs opacity-100"
            style={{ color: textColorSecondary }}
          >
            Contest: {dataPoint.contestName}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CustomizedDot: React.FC<
  DotProps & { currentTheme: "light" | "dark"; isMobile: boolean }
> = (props) => {
  const { cx, cy, payload, currentTheme, isMobile } = props as any;
  if (!payload || typeof payload.rating !== "number") return null;

  const rank = getRank(payload.rating);
  const fillColor = currentTheme === "dark" ? rank.darkColor : rank.color;
  const dotStroke = currentTheme === "dark" ? "#edc240" : "#edc240";
  const radius = isMobile ? MOBILE_DOT_RADIUS : DESKTOP_DOT_RADIUS;
  const strokeWidth = isMobile
    ? MOBILE_DOT_STROKE_WIDTH
    : DESKTOP_DOT_STROKE_WIDTH;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      stroke={dotStroke}
      strokeWidth={strokeWidth}
      fill={fillColor}
    />
  );
};

const RatingHistoryChart: React.FC<Props> = ({
  data: originalData,
  handle,
}) => {
  const { theme } = useThemeContext();
  const currentTheme = theme || "light";

  let filteredByNameData = originalData.filter((point) => {
    if (!point.contestName) return true;
    const contestNameLower = point.contestName.toLowerCase();
    return !INITIAL_CONTEST_NAMES_TO_FILTER.some(
      (filterName) => contestNameLower === filterName.toLowerCase()
    );
  });

  // *** YEH HAI NAYA CHANGE: Sabse pehle visible point ko hatana ***
  // Agar `filteredByNameData` mein kuch data hai, toh uska pehla element hata do
  const data = filteredByNameData.length > 0 ? filteredByNameData.slice(1) : [];
  // *** END OF NEW CHANGE ***

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const responsiveContainerRef = useRef<HTMLDivElement>(null);
  const windowSize = useWindowSize();
  const isMobile = windowSize.width > 0 && windowSize.width < MOBILE_BREAKPOINT;
  const [dynamicChartWidth, setDynamicChartWidth] = useState(
    isMobile ? MOBILE_CHART_MIN_WIDTH : DESKTOP_CHART_MIN_WIDTH
  );
  const [isChartWiderThanContainer, setIsChartWiderThanContainer] =
    useState(false);

  useLayoutEffect(() => {
    const currentIsMobile =
      windowSize.width > 0 && windowSize.width < MOBILE_BREAKPOINT;
    if (data && data.length > 1) {
      const firstDate = new Date(data[0].time * 1000);
      const lastDate = new Date(data[data.length - 1].time * 1000);
      const months = differenceInMonths(lastDate, firstDate);
      const monthMultiplier = currentIsMobile
        ? MOBILE_MONTH_MULTIPLIER
        : DESKTOP_MONTH_MULTIPLIER;
      const baseOffset = currentIsMobile
        ? MOBILE_BASE_WIDTH_OFFSET
        : DESKTOP_BASE_WIDTH_OFFSET;
      const minChartWidth = currentIsMobile
        ? MOBILE_CHART_MIN_WIDTH
        : DESKTOP_CHART_MIN_WIDTH;
      const calculatedWidth = Math.max(
        minChartWidth,
        Math.min(4000, months * monthMultiplier + baseOffset)
      );
      setDynamicChartWidth(calculatedWidth);
    } else if (data && data.length === 1) {
      setDynamicChartWidth(
        currentIsMobile ? MOBILE_CHART_MIN_WIDTH : DESKTOP_CHART_MIN_WIDTH
      );
    } else {
      setDynamicChartWidth(
        currentIsMobile ? MOBILE_CHART_MIN_WIDTH : DESKTOP_CHART_MIN_WIDTH
      );
    }
  }, [data, windowSize.width]);

  useEffect(() => {
    const scrollDiv = scrollContainerRef.current;
    const chartRenderedDiv = responsiveContainerRef.current;
    if (scrollDiv && chartRenderedDiv) {
      let resizeTimer: NodeJS.Timeout;
      const checkWidthsAndScroll = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const chartIsWider =
            chartRenderedDiv.offsetWidth > scrollDiv.offsetWidth;
          setIsChartWiderThanContainer(chartIsWider);
          if (chartIsWider && data && data.length > 0) {
            scrollDiv.scrollLeft =
              scrollDiv.scrollWidth - scrollDiv.clientWidth;
          } else {
            scrollDiv.scrollLeft = 0;
          }
        }, 150);
      };
      checkWidthsAndScroll();
      window.addEventListener("resize", checkWidthsAndScroll);
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", checkWidthsAndScroll);
      };
    }
  }, [dynamicChartWidth, data, windowSize.width]);

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">
        No valid rating history available for {handle} to display.
      </p>
    );
  }

  const ratings = data.map((d) => d.rating);
  const minRating = ratings.length > 0 ? Math.min(...ratings) : 0;
  const maxRating = ratings.length > 0 ? Math.max(...ratings) : 1500;

  const yDomainMin = Math.max(0, Math.floor(minRating / 200) * 200 - 200);
  const yDomainMax = Math.ceil(maxRating / 200) * 200 + 200;
  const yDomain: [number, number] = [yDomainMin, yDomainMax];

  const lineColor = currentTheme === "dark" ? "#F086F3" : "#D946EF";
  const gridStrokeColor =
    currentTheme === "dark"
      ? "rgba(100, 116, 139, 0.3)"
      : "rgba(203, 213, 225, 0.4)";
  const axisTextColor = currentTheme === "dark" ? "#CBD5E1" : "#475569";
  const axisLineColor = currentTheme === "dark" ? "#475569" : "#CBD5E1";

  const chartHeight = isMobile ? MOBILE_CHART_HEIGHT : DESKTOP_CHART_HEIGHT;
  const chartMargin = isMobile ? MOBILE_CHART_MARGIN : DESKTOP_CHART_MARGIN;
  const xAxisTickFontSize = isMobile
    ? MOBILE_XAXIS_TICK_FONT_SIZE
    : DESKTOP_XAXIS_TICK_FONT_SIZE;
  const xAxisMinTickGap = isMobile
    ? MOBILE_XAXIS_MIN_TICK_GAP
    : DESKTOP_XAXIS_MIN_TICK_GAP;
  const xAxisDy = isMobile ? MOBILE_XAXIS_DY : DESKTOP_XAXIS_DY;
  const yAxisWidth = isMobile ? MOBILE_YAXIS_WIDTH : DESKTOP_YAXIS_WIDTH;
  const yAxisTickFontSize = isMobile
    ? MOBILE_YAXIS_TICK_FONT_SIZE
    : DESKTOP_YAXIS_TICK_FONT_SIZE;
  const yAxisDx = isMobile ? MOBILE_YAXIS_DX : DESKTOP_YAXIS_DX;
  const legendHeight = isMobile ? MOBILE_LEGEND_HEIGHT : DESKTOP_LEGEND_HEIGHT;
  const legendPadding = isMobile
    ? MOBILE_LEGEND_PADDING
    : DESKTOP_LEGEND_PADDING;

  return (
    <div
      ref={scrollContainerRef}
      className={`rating-chart-scroll-container p-1 rounded-lg bg-card dark:bg-neutral-900/70 shadow-xl overflow-x-auto ${
        !isChartWiderThanContainer ? "flex justify-center" : ""
      }`}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: `${lineColor} ${
          currentTheme === "dark" ? "#1E293B" : "#F1F5F9"
        }`,
        WebkitMaskImage: isChartWiderThanContainer
          ? "linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent)"
          : "none",
        maskImage: isChartWiderThanContainer
          ? "linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent)"
          : "none",
      }}
    >
      <style>{`
        .rating-chart-scroll-container::-webkit-scrollbar { height: ${
          isMobile ? "6px" : "8px"
        }; }
        .rating-chart-scroll-container::-webkit-scrollbar-track { background: ${
          currentTheme === "dark" ? "#1E293B" : "#F1F5F9"
        }; border-radius: 4px; }
        .rating-chart-scroll-container::-webkit-scrollbar-thumb { background-color: ${lineColor}; border-radius: 4px; }
      `}</style>
      <div
        ref={responsiveContainerRef}
        style={{
          width: dynamicChartWidth,
          height: chartHeight,
          minWidth: "100%",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid
              strokeDasharray="6 6"
              stroke={gridStrokeColor}
              strokeOpacity={1}
            />
            {RATING_THRESHOLDS.map((band, index) => {
              const y1 = band.rating;
              const y2 = RATING_THRESHOLDS[index + 1]
                ? RATING_THRESHOLDS[index + 1].rating
                : yDomain[1] + 500;
              if (y1 >= yDomain[1] || y2 <= yDomain[0]) return null;
              return (
                <ReferenceArea
                  key={`band-${band.name}-${index}`}
                  y1={Math.max(y1, yDomain[0])}
                  y2={Math.min(y2, yDomain[1])}
                  ifOverflow="hidden"
                  fill={currentTheme === "dark" ? band.darkColor : band.color}
                  fillOpacity={1}
                />
              );
            })}
            <XAxis
              dataKey="time"
              tickFormatter={(unixTime) =>
                format(
                  new Date(unixTime * 1000),
                  isMobile ? "MM/yy" : "MMM dd, yy"
                )
              }
              type="number"
              domain={["dataMin", "dataMax"]}
              scale="time"
              stroke={axisLineColor}
              tick={{
                fontSize: xAxisTickFontSize,
                fill: axisTextColor,
                fontWeight: 600,
              }}
              dy={xAxisDy}
              axisLine={{ stroke: axisLineColor, strokeWidth: 1.5 }}
              tickLine={{ stroke: axisLineColor, strokeWidth: 1.5 }}
              interval="preserveStartEnd"
              minTickGap={xAxisMinTickGap}
            />
            <YAxis
              domain={yDomain}
              allowDataOverflow={true}
              width={yAxisWidth}
              stroke={axisLineColor}
              tick={{
                fontSize: yAxisTickFontSize,
                fill: axisTextColor,
                fontWeight: 600,
              }}
              dx={yAxisDx}
              axisLine={{ stroke: axisLineColor, strokeWidth: 1.5 }}
              tickLine={{ stroke: axisLineColor, strokeWidth: 1.5 }}
              tickFormatter={(value) =>
                value >= 1000 && value % 1000 === 0 && value !== 0
                  ? `${value / 1000}k`
                  : value.toString()
              }
            />
            <Tooltip
              content={<CustomTooltip handleUsername={handle} />}
              cursor={{
                stroke: lineColor,
                strokeWidth: 2.5,
                strokeDasharray: "5 10",
              }}
              wrapperStyle={{ outline: "none" }}
              animationDuration={150}
            />
            <Legend
              verticalAlign="top"
              align="center"
              height={legendHeight}
              iconType="line"
              iconSize={isMobile ? 14 : 18}
              formatter={(value) => (
                <span
                  className={`font-bold text-foreground dark:text-neutral-200 ml-1 sm:ml-2 tracking-wide ${
                    isMobile ? "text-xs" : "text-sm"
                  }`}
                >
                  {value}
                </span>
              )}
              wrapperStyle={legendPadding}
            />
            <Line
              type="monotone"
              dataKey="rating"
              name={handle}
              stroke={lineColor}
              strokeWidth={isMobile ? 2.5 : 3.5}
              dot={
                <CustomizedDot
                  currentTheme={currentTheme}
                  isMobile={isMobile}
                />
              }
              activeDot={{
                r: isMobile
                  ? MOBILE_ACTIVE_DOT_RADIUS
                  : DESKTOP_ACTIVE_DOT_RADIUS,
                strokeWidth: isMobile
                  ? MOBILE_ACTIVE_DOT_STROKE_WIDTH
                  : DESKTOP_ACTIVE_DOT_STROKE_WIDTH,
                stroke: currentTheme === "dark" ? "#F8F8F2" : "#282A36",
                fill: lineColor,
              }}
              isAnimationActive={true}
              animationDuration={800}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RatingHistoryChart;
