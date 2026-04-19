"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import BehaviourHeatmapDatePicker from "./BehaviourHeatmapDatePicker";
import CardIconTooltip from "./CardIconTooltip";

// Teal-based tile theme for heatmap
// Backend returns: "green" (disciplined 70+), "yellow" (mixed 40-69), "red" (emotional <40), "grey" (no trades)
const TILE_THEME = {
  grey: {
    bg: "rgba(0, 0, 0, 0.05)",
    border: "rgba(0, 0, 0, 0.10)",
  },
  red: {
    bg: "rgba(0, 191, 166, 0.30)",
    border: "rgba(0, 191, 166, 0.20)",
  },
  yellow: {
    bg: "rgba(0, 191, 166, 0.60)",
    border: "rgba(0, 191, 166, 0.20)",
  },
  green: {
    bg: "rgba(0, 191, 166, 0.90)",
    border: "rgba(0, 191, 166, 0.20)",
  },
};
// Teal-based tile theme for heatmap matching the design
const TILE_THEMEE = {
  grey: {
    bg: "#FFFFFF", // White for empty
    border: "transparent",
    text: "None",
  },
  red: {
    bg: "#A5F3E7", // Lightest teal (Low)
    border: "transparent",
    text: "Low",
  },
  yellow: {
    bg: "#2DD4BF", // Medium teal (Medium)
    border: "transparent",
    text: "Medium",
  },
  green: {
    bg: "#00BFA6", // Dark teal (High)
    border: "transparent",
    text: "High",
  },
};

// Get tile style for window - returns style object
const getTileStyle = (window) => {
  if (!window || window.score === null || window.score === undefined) {
    return TILE_THEME.grey;
  }

  // Determine color based on score if color not provided (for aggregated data)
  if (!window.color) {
    if (window.score >= 70) return TILE_THEME.green;
    if (window.score >= 40) return TILE_THEME.yellow;
    return TILE_THEME.red;
  }

  switch (window.color) {
    case "green":
      return TILE_THEME.green;
    case "yellow":
      return TILE_THEME.yellow;
    case "red":
      return TILE_THEME.red;
    case "grey":
    default:
      return TILE_THEME.grey;
  }
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to get start of week (Monday)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  // Convert Sunday (0) to 7, then subtract 1 to get days to subtract
  const diff = d.getDate() - ((day + 6) % 7);
  return new Date(d.setDate(diff));
};

// Helper to normalize dates to a local YYYY-MM-DD key.
const toLocalDateKey = (dateLike) => {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Helper: Normalize date to midnight UTC
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Helper: Get ISO string for start/end of day/range
const getIsoString = (date, endOfDay = false) => {
  const d = new Date(date);
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
};

// Helper to process windows data (normalize hours)
const processWindows = (windowsData) => {
  if (!windowsData || !Array.isArray(windowsData)) return [];

  return windowsData.map((window) => {
    if (window.startHour !== undefined && window.endHour !== undefined) {
      return window;
    }
    // Handle "09-12" id format
    if (window.id && window.id.includes("-")) {
      const [startHourStr, endHourStr] = window.id.split("-");
      const startHour = parseInt(startHourStr, 10);
      const endHour = parseInt(endHourStr, 10);
      return {
        ...window,
        startHour,
        endHour,
      };
    }
    return window;
  });
};

const HeatmapTile = ({
  window,
  tileStyle,
  isCurrentTimeBlock,
  hasNoTrades,
  isLoadingHistory,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Prevent stale tooltip content when the date/range changes quickly.
  useEffect(() => {
    if (isLoadingHistory) setIsHovered(false);
  }, [isLoadingHistory, window]);

  return (
    <div
      className="relative flex-1 min-w-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`w-full h-9 rounded-full cursor-pointer transition-all hover:opacity-80
          ${hasNoTrades ? "opacity-30" : ""}
          ${isLoadingHistory ? "opacity-50" : ""}
        `}
        style={{
          backgroundColor: tileStyle.bg,
          border: `1px solid ${tileStyle.border}`,
          boxShadow: isCurrentTimeBlock
            ? "0 0 0 2px rgba(0, 191, 166, 0.3), 0 0 8px rgba(0, 191, 166, 0.4)"
            : "none",
        }}
      />
      <AnimatePresence>
        {/* Only show tooltip when the cell has real score data */}
        {isHovered && window && typeof window.score === "number" && Number.isFinite(window.score) && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-1/2 -translate-x-1/2 mb-2 z-[100] pointer-events-none whitespace-normal min-w-[200px]"
          >
            <div className="bg-[#1A1A1A] bg-gradient-to-br  from-[#262626] to-[#1A1A1A] border border-white/10 rounded-xl p-3 shadow-2xl">
              <div className="text-white text-sm font-semibold mb-1">
                Score: {window.score ?? "—"}{" "}
                <span className="text-xs font-normal text-gray-400">
                  ({window.tradeCount} trades)
                </span>
              </div>
              <div className="text-gray-300 text-xs leading-relaxed">
                {window.message ||
                  (window.count > 1
                    ? `Average of ${window.count} sessions`
                    : "No specific insight")}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function BehaviourHeatmap({
  hasNoTrades = false,
  fetchHistory = null,
  selectedDate = null,
}) {
  // Track which date the currently-displayed data belongs to.
  // Any data fetched for a different date is discarded before render.
  const activeDateKeyRef = useRef(null);

  const getDateKey = (date) =>
    date ? toLocalDateKey(new Date(date)) : "today";

  // Derive week range from selectedDate (stable, no separate state needed)
  const dateRange = useMemo(() => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    const start = getStartOfWeek(base);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }, [selectedDate]);

  // historyData always starts empty; only set after a confirmed fetch for the active date
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const requestIdRef = useRef(0);

  const weekDateKeys = useMemo(() => {
    const weekStart = new Date(dateRange.start);
    weekStart.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return toLocalDateKey(d);
    });
  }, [dateRange]);

  // The fetch window is always exactly the selected date (single day)
  const rangeStartEnd = useMemo(() => {
    const fetchStart = selectedDate ? new Date(selectedDate) : new Date(dateRange.start);
    fetchStart.setHours(0, 0, 0, 0);
    const fetchEnd = new Date(fetchStart);
    fetchEnd.setHours(23, 59, 59, 999);
    return { start: fetchStart, end: fetchEnd };
  }, [selectedDate, dateRange]);

  // Filter history to only entries that fall within the fetch window AND have real trades
  const filteredHistoryData = useMemo(() => {
    if (hasNoTrades) return [];
    const { start, end } = rangeStartEnd;
    return (historyData || []).filter((dayEntry) => {
      if (!dayEntry?.date) return false;
      const t = new Date(dayEntry.date).getTime();
      if (!Number.isFinite(t) || t < start.getTime() || t > end.getTime()) return false;
      // Only include entries that have at least one window with a real score
      return Array.isArray(dayEntry.windows) &&
        dayEntry.windows.some((w) => w.score !== null && w.score !== undefined && w.tradeCount > 0);
    });
  }, [historyData, rangeStartEnd, hasNoTrades]);

  // Single fetch function — always fetches for the current selectedDate
  const fetchData = useCallback(async () => {
    if (!fetchHistory) return;

    const dateKey = getDateKey(selectedDate);
    // Mark this date as the active one before any async work
    activeDateKeyRef.current = dateKey;
    const requestId = ++requestIdRef.current;

    // Always clear immediately — no stale data ever shown
    setHistoryData([]);
    setIsLoadingHistory(true);

    if (hasNoTrades) {
      setIsLoadingHistory(false);
      return;
    }

    try {
      const startIso = getIsoString(rangeStartEnd.start);
      const endIso = getIsoString(rangeStartEnd.end, true);
      const result = await fetchHistory(startIso, endIso);

      // Discard if date changed or a newer request started while we were waiting
      if (requestId !== requestIdRef.current) return;
      if (activeDateKeyRef.current !== dateKey) return;

      const history = result?.history || (result?.windows ? [result] : []);
      // Strip entries with no real trade data before storing
      const validHistory = (history || []).filter(
        (h) => h && Array.isArray(h.windows) &&
          h.windows.some((w) => w.score !== null && w.score !== undefined && w.tradeCount > 0)
      );
      setHistoryData(validHistory);
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      if (requestId !== requestIdRef.current) return;
      setHistoryData([]);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setIsLoadingHistory(false);
    }
  }, [fetchHistory, selectedDate, rangeStartEnd, hasNoTrades]);

  // Re-fetch whenever selectedDate or hasNoTrades changes.
  // Clear state synchronously first so there is zero render with stale data.
  useEffect(() => {
    setHistoryData([]);
    setIsLoadingHistory(Boolean(fetchHistory && !hasNoTrades));
    fetchData();
  }, [fetchData]);

  const handleDateChange = (newRange) => {
    if (newRange instanceof Date) {
      setDateRange({ start: getStartOfWeek(newRange), end: (() => { const e = getStartOfWeek(newRange); e.setDate(e.getDate() + 6); return e; })() });
    }
  };

  // Aggregation Logic
  // We want to aggregate data by (DayOfWeek, TimeSlot).
  // DayOfWeek: 0 (Mon) - 6 (Sun). Note: JS getDay() is 0=Sun. We want Mon=0.
  const aggregatedData = useMemo(() => {
    const map = new Map();

    filteredHistoryData.forEach((dayEntry) => {
      if (!dayEntry.date || !dayEntry.windows) return;

      const dayKey = toLocalDateKey(dayEntry.date);
      const dayIndex = weekDateKeys.indexOf(dayKey);
      if (dayIndex === -1) return;

      const normalizedWindows = processWindows(dayEntry.windows);

      normalizedWindows.forEach((window) => {
        if (window.startHour === undefined) return;
        // Skip windows with no real trade data
        if (!window.tradeCount || window.score === null || window.score === undefined) return;

        const timeKey = `${window.startHour.toString().padStart(2, "0")}:00`;
        const key = `${dayIndex}-${timeKey}`;

        if (!map.has(key)) {
          map.set(key, {
            scoreSum: 0,
            scoreCount: 0,
            totalTrades: 0,
            count: 0,
            startHour: window.startHour,
            endHour: window.endHour,
            messages: [],
            colors: [],
          });
        }

        const agg = map.get(key);
        if (typeof window.score === "number" && Number.isFinite(window.score)) {
          agg.scoreSum += window.score;
          agg.scoreCount += 1;
        }
        agg.totalTrades += window.tradeCount || 0;
        agg.count += 1;
        if (window.message) agg.messages.push(window.message);
        if (window.color) agg.colors.push(window.color);
      });
    });

    return map;
  }, [filteredHistoryData, weekDateKeys]);

 const hasAnyHeatmapScores = useMemo(() => {
  if (isLoadingHistory) return true; // don't flash "no data" while loading
  return filteredHistoryData.length > 0;
}, [filteredHistoryData, isLoadingHistory]);

  // Helper to retrieve aggregated window for render
  const getAggregatedWindow = (dayIndex, timeSlotStart) => {
    // timeSlotStart format "HH:00"
    const key = `${dayIndex}-${timeSlotStart}`;
    const agg = aggregatedData.get(key);

    if (!agg) return null;

    const avgScore =
      agg.scoreCount > 0 ? Math.round(agg.scoreSum / agg.scoreCount) : null;

    // Determine color based on average score
    // Logic: >= 70 green, >= 40 yellow, < 40 red
    let color = "grey";
    if (avgScore === null) color = "grey";
    else if (avgScore >= 70) color = "green";
    else if (avgScore >= 40) color = "yellow";
    else color = "red";

    // Construct a window-like object
    return {
      score: avgScore,
      tradeCount: agg.totalTrades,
      color: color,
      count: agg.count, // Number of data points aggregated
      message:
        avgScore === null
          ? agg.messages[0] || "No Data"
          : agg.count > 1
            ? `Avg. Score: ${avgScore}% over ${agg.count} sessions`
            : agg.messages[0] || "No Data",
      // preserve dimensions
      startHour: agg.startHour,
      endHour: agg.endHour,
    };
  };

  // Generate TIME_SLOTS (Standard 3h blocks)
  const TIME_SLOTS_LABELS = [
    "00:00-03:00",
    "03:00-06:00",
    "06:00-09:00",
    "09:00-12:00",
    "12:00-15:00",
    "15:00-18:00",
    "18:00-21:00",
    "21:00-00:00",
  ];

  // Helper to get current time block
  const getCurrentTimeBlock = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const blockStart = Math.floor(currentHour / 3) * 3;
    const blockEnd = blockStart + 3 === 24 ? 0 : blockStart + 3;
    const startStr = blockStart.toString().padStart(2, "0");
    const endStr = blockEnd === 0 ? "00" : blockEnd.toString().padStart(2, "0");
    return `${startStr}:00-${endStr}:00`;
  };

  const currentTimeBlock = getCurrentTimeBlock();
  const today = new Date();
  const currentDayIndex =
    today.getDay() - 1 === -1 ? 6 : today.getDay() - 1;

  // Render variables
  // If range is > 7 days, we still show Mon-Sun columns.
  // The 'date' for the header isn't a single date anymore.
  // We can just show "Mon", "Tue"...
  // Or, if range is < 7 days, show the specific dates?
  // Let's stick to Mon-Sun headers. If detailed view is needed, we could add dates back.
  // For arbitrary range, "Mon" means "Every Monday in range".

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative bg-[#E8F2F3] rounded-[20px] p-4 sm:p-5  border border-[#FFFFFF] flex flex-col"
    >
      {!isLoadingHistory && !hasAnyHeatmapScores && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-20 rounded-[20px]">
          <div className="bg-white/80 px-6 py-4 rounded-xl shadow-sm border border-white/50 text-center">
            <p className="text-sm font-medium text-gray-500">
              No data available for this date
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-between gap-3 w-full ">
          <h3
            className={`text-[18px] font-semibold ${
              hasNoTrades ? "text-[#363636]" : "text-[#363636]"
            }`}
          >
            Behaviour Heatmap
          </h3>
          <CardIconTooltip
            title="Behaviour Heatmap"
            tooltipText="Maps your trading behaviour across days and time blocks, highlighting periods of high activity, hesitation, overtrading, or emotional triggers. Useful for spotting when you're most likely to excel or fall into patterns."
            position="bottom"
          >
            <div
              className={`w-10 h-10 rounded-full text-[#363636] flex items-center justify-center border border-[#FFFFFF] ${
                hasNoTrades ? "bg-[#F2F7F7]" : "bg-[#F2F7F7]"
              }`}
            >
              {/* <Squares2X2Icon
                className={`w-5 h-5 ${
                  hasNoTrades ? "text-gray-400" : "text-teal-600"
                }`}
              /> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                color="#363636"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                />
              </svg>
            </div>
          </CardIconTooltip>
        </div>
        {/* {!hasNoTrades && (
          <BehaviourHeatmapDatePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            mode="range"
            onDateChange={handleDateChange}
          />
        )} */}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Weekly Grid View */}
        <div className="w-full flex-1 flex flex-col pb-2 min-[1930px]:items-center">
          {/* Header row with days */}
          <div className="flex gap-15 mb-2 w-full">
            <div className="w-[70px] "></div>
            <div className="flex gap-1 sm:gap-1 flex-1 min-w-0">
              {DAYS.map((dayName, index) => (
                <div
                  key={dayName}
                  className={`flex-1 min-w-0 text-center text-[10px] text-[#636363]`}
                >
                  {dayName}
                </div>
              ))}
            </div>
          </div>

          {/* Time slots with heatmap cells */}
          <div className="flex- flex flex-col justify-between  w-full">
            {TIME_SLOTS_LABELS.map((timeRange) => {
              const startTime = timeRange.split("-")[0]; // e.g. "09:00"
              const shortLabel = timeRange.replace(/:00/g, ""); // "00-03"

              return (
                <div
                  key={timeRange}
                  className="flex items-center  gap-1 sm:gap-2 h- w-full"
                >
                  <div
                    className={`w-16 flex-shrink-0 text-[10px] sm:text-xs whitespace-nowrap`}
                  >
                    <span className="flex-1 min-w-0  text-center text-[10px] py-1 text-[#636363]">
                      {timeRange}
                    </span>
                  </div>
                  <div className="flex gap-1 sm:gap-1 flex-1 min-w-0 h-full">
                    {DAYS.map((_, dayIndex) => {
                      const window = getAggregatedWindow(dayIndex, startTime);
                      const isCurrentDay = dayIndex === currentDayIndex;
                      const isCurrent =
                        isCurrentDay && timeRange === currentTimeBlock;
                      const tileStyle = getTileStyle(window);
                      const cellKey = `${dayIndex}-${timeRange}`;

                      return (
                        <HeatmapTile
                          key={cellKey}
                          window={window}
                          tileStyle={tileStyle}
                          isCurrentTimeBlock={isCurrent}
                          hasNoTrades={hasNoTrades}
                          isLoadingHistory={isLoadingHistory}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border mt-2 border-[#FFFFFF]"></div>
      </div>
      {/* {hasNoTrades && ( */}
        <div className="mt-4 flex items-center justify-between px-2">
          {Object.entries(TILE_THEMEE).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: style.bg,
                  border:
                    style.border !== "transparent"
                      ? `1px solid ${style.border}`
                      : "none",
                }}
              />
              <span className="text-sm font-medium text-gray-600">
                {style.text}
              </span>
            </div>
          ))}
        </div>
      {/* )} */}
    </motion.div>
  );
}
