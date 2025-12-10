import React, {
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
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

  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
    return () => {};
  }, [handleResize]);
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

const DESKTOP_CHART_MARGIN = { top: 25, right: 50, left: 30, bottom: 35 };
const MOBILE_CHART_MARGIN = { top: 20, right: 20, left: 20, bottom: 30 };

const DESKTOP_XAXIS_TICK_FONT_SIZE = 12;
const MOBILE_XAXIS_TICK_FONT_SIZE = 10;
const DESKTOP_XAXIS_MIN_TICK_GAP = 70;
const MOBILE_XAXIS_MIN_TICK_GAP = 60;
const DESKTOP_XAXIS_DY = 12;
const MOBILE_XAXIS_DY = 10;
const DESKTOP_YAXIS_WIDTH = 60;
const MOBILE_YAXIS_WIDTH = 45;
const DESKTOP_YAXIS_TICK_FONT_SIZE = 12;
const MOBILE_YAXIS_TICK_FONT_SIZE = 10;

const DESKTOP_YAXIS_DX = -10;
const MOBILE_YAXIS_DX = -8;

const DESKTOP_DOT_RADIUS = 5.5;
const MOBILE_DOT_RADIUS = 4;
const DESKTOP_DOT_STROKE_WIDTH = 2.5;
const MOBILE_DOT_STROKE_WIDTH = 2;
const DESKTOP_ACTIVE_DOT_STROKE_WIDTH = 2.5;
const MOBILE_ACTIVE_DOT_STROKE_WIDTH = 2;
const DESKTOP_LEGEND_HEIGHT = 45;
const MOBILE_LEGEND_HEIGHT = 35;
const DESKTOP_LEGEND_PADDING = { paddingBottom: "20px", paddingTop: "5px" };
const MOBILE_LEGEND_PADDING = { paddingBottom: "15px", paddingTop: "0px" };

const Y_AXIS_CEILING_FOR_LOW_RATED_USERS = 1900;

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

const Y_AXIS_TICKS_TO_DISPLAY = [
  1200, 1400, 1600, 1900, 2100, 2300, 2400, 2600, 3000,
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

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: number;
  handleUsername: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = React.memo(
  ({ active, payload, label, handleUsername }) => {
    const themeContext = useThemeContext ? useThemeContext() : undefined;
    const theme = themeContext?.theme || "light";

    const windowSize = useWindowSize();
    const isMobile =
      windowSize.width > 0 && windowSize.width < MOBILE_BREAKPOINT;

    const tooltipStyle = useMemo(() => {
      if (active && payload && payload.length && label !== undefined) {
        const dataPoint = payload[0].payload as RatingDataPoint;
        const rank = getRank(dataPoint.rating);
        const rankColor = theme === "dark" ? rank.darkColor : rank.color;
        const bgColor =
          theme === "dark"
            ? "rgba(30, 32, 42, 0.97)"
            : "rgba(250, 250, 255, 0.97)";
        const textColorPrimary = theme === "dark" ? "#F0F0F0" : "#1E1E2E";

        return {
          backgroundColor: bgColor,
          border: `2px solid ${rankColor}`,
          color: textColorPrimary,
          maxWidth: isMobile ? "160px" : undefined,
        };
      }
      return {};
    }, [active, payload, label, theme, isMobile]);

    if (active && payload && payload.length && label !== undefined) {
      const dataPoint = payload[0].payload as RatingDataPoint;
      const rank = getRank(dataPoint.rating);
      const rankColor = theme === "dark" ? rank.darkColor : rank.color;
      const textColorSecondary = theme === "dark" ? "#A0A0B0" : "#5E5E6E";

      return (
        <div
          className={`${
            isMobile ? "p-1.5 text-[8px]" : "p-3 text-xs sm:text-sm"
          } shadow-2xl rounded-lg backdrop-blur-sm`}
          style={tooltipStyle}
        >
          <p
            className={`font-bold ${
              isMobile ? "text-[8px] mb-0.5" : "mb-1 sm:mb-1.5"
            }`}
          >
            {format(new Date(label * 1000), "MMM d, yy, h:mm a")}
          </p>
          <div
            className={`flex items-baseline ${
              isMobile ? "mb-0.5" : "mb-0.5 sm:mb-1"
            }`}
          >
            <span
              className={`font-extrabold ${
                isMobile ? "text-[8px]" : "text-lg sm:text-xl"
              }`}
              style={{ color: rankColor }}
            >
              {dataPoint.rating}
            </span>
            <span
              className={`${isMobile ? "ml-1" : "ml-1.5 sm:ml-2"} opacity-100`}
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
              className={`${
                isMobile ? "mt-1" : "mt-1 sm:mt-1.5"
              } text-2xs sm:text-xs opacity-100`}
              style={{ color: textColorSecondary }}
            >
              Contest: {dataPoint.contestName}
            </p>
          )}
        </div>
      );
    }
    return null;
  }
);
CustomTooltip.displayName = "CustomTooltip";

interface CustomizedDotComponentProps extends DotProps {
  currentTheme: "light" | "dark";
  isMobile: boolean;
  payload?: RatingDataPoint;
}

const CustomizedDot: React.FC<CustomizedDotComponentProps> = React.memo(
  (props) => {
    const { cx, cy, payload, currentTheme, isMobile } = props;

    if (
      !payload ||
      typeof payload.rating !== "number" ||
      cx == null ||
      cy == null
    )
      return null;

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
  }
);
CustomizedDot.displayName = "CustomizedDot";

const RatingHistoryChart: React.FC<Props> = ({
  data: originalData,
  handle,
}) => {
  const themeContext = useThemeContext ? useThemeContext() : undefined;
  const currentTheme = themeContext?.theme || "light";

  const dataToRender = useMemo(() => {
    const filteredByNameData = originalData.filter((point) => {
      if (!point.contestName) return true;
      const contestNameLower = point.contestName.toLowerCase();
      return !INITIAL_CONTEST_NAMES_TO_FILTER.some(
        (filterName) => contestNameLower === filterName.toLowerCase()
      );
    });
    return filteredByNameData.length > 0 ? filteredByNameData.slice(1) : [];
  }, [originalData]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const responsiveContainerRef = useRef<HTMLDivElement>(null);
  const windowSize = useWindowSize();
  const isMobile = windowSize.width > 0 && windowSize.width < MOBILE_BREAKPOINT;

  const totalMonthsSpan = useMemo(() => {
    if (dataToRender && dataToRender.length > 1) {
      const firstDate = new Date(dataToRender[0].time * 1000);
      const lastDate = new Date(
        dataToRender[dataToRender.length - 1].time * 1000
      );
      return differenceInMonths(lastDate, firstDate);
    } else if (dataToRender && dataToRender.length === 1) {
      return 0;
    }
    return null;
  }, [dataToRender]);

  const dynamicChartWidth = useMemo(() => {
    const monthsForWidthCalc = totalMonthsSpan !== null ? totalMonthsSpan : 0;
    if (dataToRender && dataToRender.length > 0) {
      const monthMultiplier = isMobile
        ? MOBILE_MONTH_MULTIPLIER
        : DESKTOP_MONTH_MULTIPLIER;
      const baseOffset = isMobile
        ? MOBILE_BASE_WIDTH_OFFSET
        : DESKTOP_BASE_WIDTH_OFFSET;
      const minChartWidth = isMobile
        ? MOBILE_CHART_MIN_WIDTH
        : DESKTOP_CHART_MIN_WIDTH;
      return Math.max(
        minChartWidth,
        Math.min(4000, monthsForWidthCalc * monthMultiplier + baseOffset)
      );
    }
    return isMobile ? MOBILE_CHART_MIN_WIDTH : DESKTOP_CHART_MIN_WIDTH;
  }, [dataToRender, isMobile, totalMonthsSpan]);

  const [isChartWiderThanContainer, setIsChartWiderThanContainer] =
    useState(false);

  const checkWidthsAndScroll = useCallback(() => {
    const scrollDiv = scrollContainerRef.current;
    const chartRenderedDiv = responsiveContainerRef.current;
    if (scrollDiv && chartRenderedDiv) {
      const chartIsWider = chartRenderedDiv.offsetWidth > scrollDiv.offsetWidth;
      setIsChartWiderThanContainer(chartIsWider);
      if (chartIsWider && dataToRender && dataToRender.length > 0) {
        scrollDiv.scrollLeft = scrollDiv.scrollWidth - scrollDiv.clientWidth;
      } else {
        scrollDiv.scrollLeft = 0;
      }
    }
  }, [dataToRender]);

  useEffect(() => {
    const scrollDiv = scrollContainerRef.current;
    if (scrollDiv) {
      let resizeTimer: NodeJS.Timeout;
      const debouncedCheck = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(checkWidthsAndScroll, 150);
      };
      debouncedCheck();
      window.addEventListener("resize", debouncedCheck);
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", debouncedCheck);
      };
    }
  }, [dynamicChartWidth, dataToRender, windowSize.width, checkWidthsAndScroll]);

  const xAxisTickFormatString = useMemo(() => {
    const YEAR_FORMAT = "yyyy";
    const MONTH_YEAR_FORMAT = "MMM yyyy";
    const SHORT_SPAN_FORMAT_DESKTOP = "MMM d";
    const SHORT_SPAN_FORMAT_MOBILE = "MM/dd";
    const DETAILED_SHORT_SPAN_FORMAT_DESKTOP = "MMM d, yyyy";
    const DETAILED_SHORT_SPAN_FORMAT_MOBILE = "MM/dd/yy";
    const YEAR_VIEW_THRESHOLD_MONTHS = 24;

    if (totalMonthsSpan !== null) {
      if (totalMonthsSpan > YEAR_VIEW_THRESHOLD_MONTHS) {
        return YEAR_FORMAT;
      } else if (totalMonthsSpan === 0 && dataToRender.length > 1) {
        const firstDate = new Date(dataToRender[0].time * 1000);
        const lastDate = new Date(
          dataToRender[dataToRender.length - 1].time * 1000
        );
        if (
          firstDate.getFullYear() === lastDate.getFullYear() &&
          firstDate.getMonth() === lastDate.getMonth()
        ) {
          return isMobile
            ? SHORT_SPAN_FORMAT_MOBILE
            : SHORT_SPAN_FORMAT_DESKTOP;
        } else {
          return isMobile
            ? DETAILED_SHORT_SPAN_FORMAT_MOBILE
            : DETAILED_SHORT_SPAN_FORMAT_DESKTOP;
        }
      } else {
        return MONTH_YEAR_FORMAT;
      }
    }
    return MONTH_YEAR_FORMAT;
  }, [totalMonthsSpan, dataToRender, isMobile]);

  const { dataMinRating, dataMaxRating } = useMemo(() => {
    if (!dataToRender || dataToRender.length === 0) {
      return { dataMinRating: 0, dataMaxRating: 1500 };
    }
    const ratings = dataToRender.map((d) => d.rating);
    return {
      dataMinRating: Math.min(...ratings),
      dataMaxRating: Math.max(...ratings),
    };
  }, [dataToRender]);

  const yDomain = useMemo((): [number, number] => {
    if (!dataToRender || dataToRender.length === 0) {
      return [0, Y_AXIS_CEILING_FOR_LOW_RATED_USERS];
    }

    const minRequiredTickValue = Y_AXIS_TICKS_TO_DISPLAY[0];
    const maxRequiredTickValue =
      Y_AXIS_TICKS_TO_DISPLAY[Y_AXIS_TICKS_TO_DISPLAY.length - 1];

    const minDataBandIndex = RATING_THRESHOLDS.indexOf(getRank(dataMinRating));
    const maxDataBandIndex = RATING_THRESHOLDS.indexOf(getRank(dataMaxRating));

    let targetFirstBandIndex = minDataBandIndex;
    let targetLastBandIndex = maxDataBandIndex;
    const minBandsToShow = 3;

    const numBandsCoveredByData =
      targetLastBandIndex - targetFirstBandIndex + 1;
    if (numBandsCoveredByData < minBandsToShow) {
      const bandsToAdd = minBandsToShow - numBandsCoveredByData;
      const addBelow = Math.ceil(bandsToAdd / 2);
      const addAbove = Math.floor(bandsToAdd / 2);
      let prospectiveMinBandIndex = Math.max(
        0,
        targetFirstBandIndex - addBelow
      );
      let prospectiveMaxBandIndex = Math.min(
        RATING_THRESHOLDS.length - 1,
        targetLastBandIndex + addAbove
      );
      const currentSpan = prospectiveMaxBandIndex - prospectiveMinBandIndex + 1;
      if (currentSpan < minBandsToShow) {
        const remainingNeeded = minBandsToShow - currentSpan;
        if (
          prospectiveMinBandIndex === 0 &&
          prospectiveMaxBandIndex < RATING_THRESHOLDS.length - 1
        ) {
          prospectiveMaxBandIndex = Math.min(
            RATING_THRESHOLDS.length - 1,
            prospectiveMaxBandIndex + remainingNeeded
          );
        } else if (
          prospectiveMaxBandIndex === RATING_THRESHOLDS.length - 1 &&
          prospectiveMinBandIndex > 0
        ) {
          prospectiveMinBandIndex = Math.max(
            0,
            prospectiveMinBandIndex - remainingNeeded
          );
        }
      }
      targetFirstBandIndex = prospectiveMinBandIndex;
      targetLastBandIndex = prospectiveMaxBandIndex;
    }
    targetLastBandIndex = Math.min(
      RATING_THRESHOLDS.length - 1,
      Math.max(targetLastBandIndex, targetFirstBandIndex + minBandsToShow - 1)
    );
    if (
      targetLastBandIndex - targetFirstBandIndex + 1 < minBandsToShow &&
      targetLastBandIndex === RATING_THRESHOLDS.length - 1
    ) {
      targetFirstBandIndex = Math.max(
        0,
        targetLastBandIndex - (minBandsToShow - 1)
      );
    }

    const yDomainToEnsureBandsMin =
      RATING_THRESHOLDS[targetFirstBandIndex].rating;
    let yDomainToEnsureBandsMax;
    if (targetLastBandIndex + 1 < RATING_THRESHOLDS.length) {
      yDomainToEnsureBandsMax =
        RATING_THRESHOLDS[targetLastBandIndex + 1].rating;
    } else {
      yDomainToEnsureBandsMax =
        RATING_THRESHOLDS[targetLastBandIndex].rating + (isMobile ? 200 : 400);
    }

    const calculatedDomainMin = Math.min(
      dataMinRating,
      yDomainToEnsureBandsMin
    );
    let finalDomainMinWithTicks = Math.min(
      calculatedDomainMin,
      minRequiredTickValue
    );
    finalDomainMinWithTicks =
      Math.floor(finalDomainMinWithTicks / 100) * 100 - (isMobile ? 50 : 100);
    let finalDomainMin = Math.max(0, finalDomainMinWithTicks);

    let determinedMaxYForDomain: number;
    if (dataMaxRating < Y_AXIS_CEILING_FOR_LOW_RATED_USERS) {
      determinedMaxYForDomain = Y_AXIS_CEILING_FOR_LOW_RATED_USERS;
    } else {
      const calculatedDomainMaxBasedOnDataAndBands = Math.max(
        dataMaxRating,
        yDomainToEnsureBandsMax
      );
      determinedMaxYForDomain = Math.max(
        calculatedDomainMaxBasedOnDataAndBands,
        maxRequiredTickValue
      );
    }

    let finalDomainMax =
      Math.ceil(determinedMaxYForDomain / 100) * 100 + (isMobile ? 100 : 200);

    const minYAxisSpan = isMobile ? 300 : 400;
    if (finalDomainMax - finalDomainMin < minYAxisSpan) {
      if (
        dataMaxRating < Y_AXIS_CEILING_FOR_LOW_RATED_USERS &&
        determinedMaxYForDomain === Y_AXIS_CEILING_FOR_LOW_RATED_USERS
      ) {
        //
      } else {
        finalDomainMax = finalDomainMin + minYAxisSpan;
      }
    }
    finalDomainMax = Math.max(
      finalDomainMax,
      Math.ceil(determinedMaxYForDomain / 100) * 100 + (isMobile ? 100 : 200)
    );
    if (
      finalDomainMin > finalDomainMax - (isMobile ? 100 : 200) &&
      finalDomainMin > 0
    ) {
      finalDomainMin = Math.max(0, finalDomainMax - (isMobile ? 200 : 300));
      finalDomainMin =
        Math.floor(finalDomainMin / 100) * 100 - (isMobile ? 0 : 50);
      finalDomainMin = Math.max(0, finalDomainMin);
    }

    return [finalDomainMin, finalDomainMax];
  }, [dataToRender, dataMinRating, dataMaxRating, isMobile]);

  const chartVisuals = useMemo(() => {
    const lineColor = "#edc240";
    return {
      lineColor,
      gridStrokeColor:
        currentTheme === "dark"
          ? "rgba(100, 116, 139, 0.3)"
          : "rgba(203, 213, 225, 0.4)",
      axisTextColor: currentTheme === "dark" ? "#CBD5E1" : "#475569",
      axisLineColor: currentTheme === "dark" ? "#475569" : "#CBD5E1",
      chartHeight: isMobile ? MOBILE_CHART_HEIGHT : DESKTOP_CHART_HEIGHT,
      chartMargin: isMobile ? MOBILE_CHART_MARGIN : DESKTOP_CHART_MARGIN,
      xAxisTickFontSize: isMobile
        ? MOBILE_XAXIS_TICK_FONT_SIZE
        : DESKTOP_XAXIS_TICK_FONT_SIZE,
      xAxisMinTickGap: isMobile
        ? MOBILE_XAXIS_MIN_TICK_GAP
        : DESKTOP_XAXIS_MIN_TICK_GAP,
      xAxisDy: isMobile ? MOBILE_XAXIS_DY : DESKTOP_XAXIS_DY,
      yAxisWidth: isMobile ? MOBILE_YAXIS_WIDTH : DESKTOP_YAXIS_WIDTH,
      yAxisTickFontSize: isMobile
        ? MOBILE_YAXIS_TICK_FONT_SIZE
        : DESKTOP_YAXIS_TICK_FONT_SIZE,
      yAxisDx: isMobile ? MOBILE_YAXIS_DX : DESKTOP_YAXIS_DX,
      legendHeight: isMobile ? MOBILE_LEGEND_HEIGHT : DESKTOP_LEGEND_HEIGHT,
      legendPadding: isMobile ? MOBILE_LEGEND_PADDING : DESKTOP_LEGEND_PADDING,
      activeDotProps: {
        r: isMobile ? MOBILE_DOT_RADIUS : DESKTOP_DOT_RADIUS,
        strokeWidth: isMobile
          ? MOBILE_ACTIVE_DOT_STROKE_WIDTH
          : DESKTOP_ACTIVE_DOT_STROKE_WIDTH,
        stroke: currentTheme === "dark" ? "#F8F8F2" : "#282A36",
        fill: lineColor,
      },
      tooltipCursorStyle: {
        stroke: lineColor,
        strokeWidth: 2.5,
        strokeDasharray: "5 10",
      },
    };
  }, [isMobile, currentTheme]);

  const xAxisTickFormatter = useCallback(
    (unixTime: number) => {
      if (typeof unixTime !== "number" || isNaN(unixTime)) return "";
      try {
        return format(new Date(unixTime * 1000), xAxisTickFormatString);
      } catch (e) {
        return "";
      }
    },
    [xAxisTickFormatString]
  );

  const yAxisTickFormatter = useCallback(
    (value: number) => value.toString(),
    []
  );

  const legendFormatter = useCallback(
    (value: string) => (
      <span
        className={`font-bold text-foreground dark:text-neutral-200 ml-1 sm:ml-2 tracking-wide ${
          isMobile ? "text-xs" : "text-sm"
        }`}
      >
        {value}
      </span>
    ),
    [isMobile]
  );

  const referenceAreas = useMemo(() => {
    return RATING_THRESHOLDS.map((band, index) => {
      const y1 = band.rating;
      const y2 = RATING_THRESHOLDS[index + 1]
        ? RATING_THRESHOLDS[index + 1].rating
        : yDomain[1] + 100;

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
    }).filter(Boolean);
  }, [yDomain, currentTheme]);

  const scrollContainerDynamicStyle = useMemo(
    () => ({
      scrollbarWidth: "thin" as const,
      scrollbarColor: `${chartVisuals.lineColor} ${
        currentTheme === "dark" ? "#1E293B" : "#F1F5F9"
      }`,
      WebkitMaskImage: isChartWiderThanContainer
        ? "linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent)"
        : "none",
      maskImage: isChartWiderThanContainer
        ? "linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent)"
        : "none",
    }),
    [chartVisuals.lineColor, currentTheme, isChartWiderThanContainer]
  );

  const scrollbarInlineStyles = useMemo(
    () => `
    .rating-chart-scroll-container::-webkit-scrollbar { height: ${
      isMobile ? "6px" : "8px"
    }; }
    .rating-chart-scroll-container::-webkit-scrollbar-track { background: ${
      currentTheme === "dark" ? "#1E293B" : "#F1F5F9"
    }; border-radius: 4px; }
    .rating-chart-scroll-container::-webkit-scrollbar-thumb { background-color: ${
      chartVisuals.lineColor
    }; border-radius: 4px; }
  `,
    [isMobile, currentTheme, chartVisuals.lineColor]
  );

  const responsiveContainerDynamicStyle = useMemo(
    () => ({
      width: dynamicChartWidth,
      height: chartVisuals.chartHeight,
      minWidth: "100%",
    }),
    [dynamicChartWidth, chartVisuals.chartHeight]
  );

  const customizedDotElement = useMemo(
    () => <CustomizedDot currentTheme={currentTheme} isMobile={isMobile} />,
    [currentTheme, isMobile]
  );

  if (!dataToRender || dataToRender.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">
        No valid rating history available for {handle} to display.
      </p>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className={`rating-chart-scroll-container p-1 rounded-lg bg-card dark:bg-neutral-900/70 shadow-xl overflow-x-auto ${
        !isChartWiderThanContainer ? "flex justify-center" : ""
      }`}
      style={scrollContainerDynamicStyle}
    >
      <style>{scrollbarInlineStyles}</style>
      <div ref={responsiveContainerRef} style={responsiveContainerDynamicStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataToRender} margin={chartVisuals.chartMargin}>
            <CartesianGrid
              strokeDasharray="6 6"
              stroke={chartVisuals.gridStrokeColor}
              strokeOpacity={1}
            />
            {referenceAreas}
            <XAxis
              dataKey="time"
              tickFormatter={xAxisTickFormatter}
              type="number"
              domain={["dataMin", "dataMax"]}
              scale="time"
              stroke={chartVisuals.axisLineColor}
              tick={{
                fontSize: chartVisuals.xAxisTickFontSize,
                fill: chartVisuals.axisTextColor,
                fontWeight: 600,
              }}
              dy={chartVisuals.xAxisDy}
              axisLine={{
                stroke: chartVisuals.axisLineColor,
                strokeWidth: 1.5,
              }}
              tickLine={{
                stroke: chartVisuals.axisLineColor,
                strokeWidth: 1.5,
              }}
              interval="preserveStartEnd"
              minTickGap={chartVisuals.xAxisMinTickGap}
            />
            <YAxis
              domain={yDomain}
              ticks={Y_AXIS_TICKS_TO_DISPLAY.filter(
                (tick) => tick >= yDomain[0] && tick <= yDomain[1]
              )}
              interval={0}
              allowDataOverflow={false}
              width={chartVisuals.yAxisWidth}
              stroke={chartVisuals.axisLineColor}
              tick={{
                fontSize: chartVisuals.yAxisTickFontSize,
                fill: chartVisuals.axisTextColor,
                fontWeight: 600,
              }}
              dx={chartVisuals.yAxisDx}
              axisLine={{
                stroke: chartVisuals.axisLineColor,
                strokeWidth: 1.5,
              }}
              tickLine={{
                stroke: chartVisuals.axisLineColor,
                strokeWidth: 1.5,
              }}
              tickFormatter={yAxisTickFormatter}
            />
            <Tooltip
              content={<CustomTooltip handleUsername={handle} />}
              cursor={chartVisuals.tooltipCursorStyle}
              wrapperStyle={{ outline: "none" }}
              animationDuration={150}
            />
            <Legend
              verticalAlign="top"
              align="center"
              height={chartVisuals.legendHeight}
              iconType="line"
              iconSize={isMobile ? 14 : 18}
              formatter={legendFormatter}
              wrapperStyle={chartVisuals.legendPadding}
            />
            <Line
              type="monotone"
              dataKey="rating"
              name={handle}
              stroke={chartVisuals.lineColor}
              strokeWidth={isMobile ? 2.5 : 3.5}
              dot={customizedDotElement}
              activeDot={chartVisuals.activeDotProps}
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

export default React.memo(RatingHistoryChart);
