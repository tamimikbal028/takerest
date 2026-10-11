import { useState } from "react";
import trackerHooks from "@/hooks/useTracker";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trophy,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";

interface MonthlyHeatmapCalendarProps {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getStudyHeatmapLevel = (seconds: number) => {
  const hours = seconds / 3600;

  if (seconds === 0) {
    return {
      level: 0,
      label: "0h",
      description: "No study activity",
      bgClass: "bg-gray-100/90 hover:bg-gray-200/90 text-gray-600",
      borderClass: "border-gray-200",
      timeTextClass: "text-gray-400",
      legendClass: "bg-gray-100 border-gray-200 text-gray-600",
    };
  }

  if (hours <= 3) {
    return {
      level: 1,
      label: ">0h – 3h",
      description: "Light study session",
      bgClass: "bg-emerald-100 hover:bg-emerald-200/90 text-emerald-900",
      borderClass: "border-emerald-300/90",
      timeTextClass: "text-emerald-700 font-semibold",
      legendClass: "bg-emerald-100 border-emerald-300 text-emerald-800",
    };
  }

  if (hours <= 6) {
    return {
      level: 2,
      label: "3h – 6h",
      description: "Moderate study session",
      bgClass: "bg-emerald-300 hover:bg-emerald-400 text-emerald-950",
      borderClass: "border-emerald-400",
      timeTextClass: "text-emerald-900 font-bold",
      legendClass: "bg-emerald-300 border-emerald-400 text-emerald-950",
    };
  }

  if (hours <= 9) {
    return {
      level: 3,
      label: "6h – 9h",
      description: "Deep study focus",
      bgClass: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs",
      borderClass: "border-emerald-600",
      timeTextClass: "text-emerald-100 font-bold",
      legendClass: "bg-emerald-500 border-emerald-600 text-white",
    };
  }

  if (hours <= 12) {
    return {
      level: 4,
      label: "9h – 12h",
      description: "Intense study marathon",
      bgClass: "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs",
      borderClass: "border-emerald-800",
      timeTextClass: "text-emerald-100 font-black",
      legendClass: "bg-emerald-700 border-emerald-800 text-white",
    };
  }

  return {
    level: 5,
    label: "12h+",
    description: "Peak ultra productive",
    bgClass: "bg-emerald-900 hover:bg-emerald-950 text-emerald-50 shadow-sm",
    borderClass: "border-emerald-950 ring-1 ring-emerald-400/50",
    timeTextClass: "text-emerald-200 font-black",
    legendClass:
      "bg-emerald-900 border-emerald-950 text-emerald-100 ring-1 ring-emerald-400",
  };
};

const LEGEND_ITEMS = [
  { level: 0, label: "0h", range: "0m" },
  { level: 1, label: ">0–3h", range: "1m – 3h" },
  { level: 2, label: "3–6h", range: "3h – 6h" },
  { level: 3, label: "6–9h", range: "6h – 9h" },
  { level: 4, label: "9–12h", range: "9h – 12h" },
  { level: 5, label: "12h+", range: "12h+" },
];

const formatDurationShort = (seconds: number): string => {
  if (seconds === 0) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const formatDurationFull = (seconds: number): string => {
  if (seconds === 0) return "0 minutes";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? "s" : ""}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? "s" : ""}`);
  return parts.join(" ");
};

export const MonthlyHeatmapCalendar = ({
  selectedDate,
  onSelectDate,
}: MonthlyHeatmapCalendarProps) => {
  // Extract initial year & month from selectedDate or today
  const [selectedY, selectedM] = selectedDate.split("-").map(Number);
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();
  const todayStr = `${todayY}-${String(todayM).padStart(2, "0")}-${String(todayD).padStart(2, "0")}`;

  const [currentYear, setCurrentYear] = useState<number>(selectedY || todayY);
  const [currentMonth, setCurrentMonth] = useState<number>(selectedM || todayM);

  const { monthStudySummary, isLoading } = trackerHooks.useMonthStudySummary(
    currentYear,
    currentMonth
  );

  const monthName = new Date(
    currentYear,
    currentMonth - 1,
    1
  ).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const isCurrentCalendarMonth =
    currentYear === todayY && currentMonth === todayM;

  // Selected date logic
  const [selYear, selMonth, selDay] = selectedDate.split("-").map(Number);
  const isSelectedInCurrentMonth =
    currentYear === selYear && currentMonth === selMonth;

  const { monthStudySummary: selectedDateMonthSummary } =
    trackerHooks.useMonthStudySummary(selYear, selMonth);

  const selectedDayStudySeconds =
    (isSelectedInCurrentMonth
      ? monthStudySummary?.days?.[selectedDate]?.studySeconds
      : selectedDateMonthSummary?.days?.[selectedDate]?.studySeconds) ?? 0;

  const formattedSelectedDayLabel = new Date(
    selYear,
    selMonth - 1,
    selDay
  ).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const isSelectedToday = selectedDate === todayStr;

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToThisMonth = () => {
    setCurrentYear(todayY);
    setCurrentMonth(todayM);
    onSelectDate(todayStr);
  };

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sun, 6 = Sat
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const daysMap = monthStudySummary?.days || {};
  const totalStudySeconds = monthStudySummary?.totalStudySeconds ?? 0;
  const activeStudyDaysCount = monthStudySummary?.activeStudyDaysCount ?? 0;
  const peakDay = monthStudySummary?.peakDay;

  const avgSecondsPerActiveDay =
    activeStudyDaysCount > 0
      ? Math.round(totalStudySeconds / activeStudyDaysCount)
      : 0;

  return (
    <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-xs transition sm:p-6">
      {/* 1. Header with Title & Month Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2.5 sm:justify-start">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-2xs">
              <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 sm:text-lg truncate">
                Study Heatmap
              </h2>
              <p className="text-[11px] text-gray-400 sm:text-xs">
                3-hour interval intensity shades
              </p>
            </div>
          </div>

          <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-emerald-700">
            <Sparkles className="h-3 w-3 shrink-0" />
            Study Only
          </span>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {!isCurrentCalendarMonth && (
            <button
              type="button"
              onClick={handleJumpToThisMonth}
              className="cursor-pointer rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 shrink-0"
            >
              This Month
            </button>
          )}

          <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="cursor-pointer rounded-xl p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="min-w-[115px] sm:min-w-[130px] px-2 sm:px-3 text-center font-mono text-xs font-bold text-gray-900 sm:text-sm">
              {monthName}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="cursor-pointer rounded-xl p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Monthly Study Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            <span className="truncate">
              {isSelectedToday
                ? "Today's Study"
                : `${formattedSelectedDayLabel} Study`}
            </span>
          </div>
          <div className="mt-1 font-mono text-base font-black text-gray-900 sm:text-lg">
            {formatDurationShort(selectedDayStudySeconds) || "0m"}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span>Active Study Days</span>
          </div>
          <div className="mt-1 font-mono text-base font-black text-gray-900 sm:text-lg">
            {activeStudyDaysCount} / {daysInMonth}{" "}
            <span className="text-xs font-normal text-gray-400">days</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
            <span>Daily Average</span>
          </div>
          <div className="mt-1 font-mono text-base font-black text-gray-900 sm:text-lg">
            {formatDurationShort(avgSecondsPerActiveDay) || "0m"}
            <span className="text-xs font-normal text-gray-400"> / active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>Best Study Day</span>
          </div>
          <div className="mt-1 truncate font-mono text-base font-black text-gray-900 sm:text-lg">
            {peakDay ? (
              <>
                {formatDurationShort(peakDay.studySeconds)}
                <span className="ml-1 text-[11px] font-normal text-gray-400">
                  (
                  {new Date(peakDay.date + "T00:00:00").toLocaleDateString(
                    undefined,
                    { day: "numeric", month: "short" }
                  )}
                  )
                </span>
              </>
            ) : (
              <span className="text-xs font-normal text-gray-400">None</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Calendar Grid */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-2 sm:p-3">
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-[11px] font-bold tracking-wider text-gray-400 uppercase sm:gap-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: 35 }).map((_, idx) => (
              <div
                key={idx}
                className="h-14 animate-pulse rounded-2xl bg-gray-200/60 sm:h-16"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Blank padding cells before the first day of the month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="h-14 rounded-2xl border border-dashed border-gray-100 bg-transparent opacity-30 sm:h-16"
              />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${monthPrefix}-${String(dayNum).padStart(2, "0")}`;
              const dayData = daysMap[dateStr];
              const studySeconds = dayData?.studySeconds || 0;
              const studyLogsCount = dayData?.studyLogsCount || 0;
              const heatmap = getStudyHeatmapLevel(studySeconds);

              const isSelected = selectedDate === dateStr;
              const isTodayCell = dateStr === todayStr;

              const tooltipText = `${new Date(
                dateStr + "T00:00:00"
              ).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}\nStudy Time: ${formatDurationFull(studySeconds)}\nSessions: ${studyLogsCount} log${
                studyLogsCount === 1 ? "" : "s"
              }\nIntensity: ${heatmap.label} (${heatmap.description})`;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  title={tooltipText}
                  className={`group relative flex h-14 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-1.5 text-left transition-all duration-200 active:scale-95 sm:h-16 sm:p-2 ${
                    heatmap.bgClass
                  } ${heatmap.borderClass} ${
                    isSelected
                      ? "z-10 scale-[1.03] border-purple-600 shadow-md ring-3 ring-purple-600 ring-offset-2"
                      : "hover:scale-[1.02] hover:shadow-2xs"
                  }`}
                >
                  {/* Top: Day Number & Today Indicator */}
                  <div className="flex min-w-0 items-center justify-between gap-1">
                    <span
                      className={`shrink-0 font-mono text-xs font-bold sm:text-sm ${
                        heatmap.level >= 3 ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {isTodayCell && (
                      <>
                        <span
                          className={`py-0.2 hidden shrink-0 items-center rounded-full px-1.5 text-[9px] font-extrabold tracking-wider uppercase sm:inline-flex ${
                            heatmap.level >= 3
                              ? "bg-white text-emerald-800"
                              : "bg-purple-600 text-white"
                          }`}
                        >
                          Today
                        </span>
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full sm:hidden ${
                            heatmap.level >= 3 ? "bg-white" : "bg-purple-600"
                          }`}
                          title="Today"
                        />
                      </>
                    )}
                  </div>

                  {/* Bottom: Study Hours Text */}
                  <div className="flex min-w-0 items-center justify-between gap-1">
                    <span
                      className={`truncate font-mono text-[10px] sm:text-xs ${heatmap.timeTextClass}`}
                    >
                      {studySeconds > 0
                        ? formatDurationShort(studySeconds)
                        : "0m"}
                    </span>

                    {/* Small badge dot for 12h+ peak */}
                    {heatmap.level === 5 && (
                      <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 ring-1 ring-white sm:h-2 sm:w-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Legend Bar: Exactly 3-Hour Interval Progression */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">Study Intensity:</span>
          <span className="text-[11px] text-gray-400">
            (3-hour interval steps up to 12h+)
          </span>
        </div>

        {/* Legend color swatches */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium text-gray-400">
            Less
          </span>

          {LEGEND_ITEMS.map((item) => {
            const h = getStudyHeatmapLevel(
              item.level === 0
                ? 0
                : item.level === 1
                  ? 2 * 3600
                  : item.level === 2
                    ? 5 * 3600
                    : item.level === 3
                      ? 8 * 3600
                      : item.level === 4
                        ? 11 * 3600
                        : 13 * 3600
            );

            return (
              <div
                key={item.level}
                className={`flex items-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-bold shadow-2xs ${h.legendClass}`}
                title={`Level ${item.level}: ${item.range}`}
              >
                <span>{item.label}</span>
              </div>
            );
          })}

          <span className="ml-1 text-[11px] font-medium text-gray-400">
            More
          </span>
        </div>
      </div>
    </div>
  );
};
