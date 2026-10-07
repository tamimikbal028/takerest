import { useState } from "react";
import trackerHooks from "@/hooks/useTracker";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ACTIVITY_PALETTE = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#E11D48", // rose
  "#84CC16", // lime
  "#0EA5E9", // sky
];

export const StatisticsPage = () => {
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const { summary, isLoading, isError } =
    trackerHooks.useDaySummary(selectedDate);

  // Helper date shift
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    setSelectedDate(getLocalDateString(dateObj));
  };

  const isToday = selectedDate === todayStr;

  const formatHoursMins = (secs: number) => {
    if (secs === 0) return "0m";
    if (secs < 60) return `${secs}s`;
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const totalTrackedSeconds = summary?.totalTrackedSeconds ?? 0;
  const categoryBreakdown = summary?.categoryBreakdown ?? [];

  // Formatted date title
  const [yearNum, monthNum, dayNum] = selectedDate.split("-").map(Number);
  const formattedDateTitle = new Date(
    yearNum,
    monthNum - 1,
    dayNum
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* 1. Header Card: Date Controller & Category Overview Bar */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs sm:p-6">
        <h1 className="sr-only">Statistics - {formattedDateTitle}</h1>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                title="Previous Day"
                className="cursor-pointer rounded-xl p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Clickable Middle Date with picker */}
              <div className="group relative flex items-center rounded-xl transition hover:bg-white">
                <div className="flex cursor-pointer items-center gap-2 px-3 py-1.5 font-mono text-xs font-bold text-gray-800 transition group-hover:text-purple-700 sm:px-3.5 sm:text-sm">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span>{formattedDateTitle}</span>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  max={todayStr}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      // Fallback if unsupported
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  style={{
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                  }}
                  title="Click to select date"
                />
              </div>

              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                disabled={isToday}
                title="Next Day"
                className="cursor-pointer rounded-xl p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="cursor-pointer rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-100 active:scale-95"
              >
                Today
              </button>
            )}
          </div>

          {/* Quick status */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium">Total Tracked:</span>
            <span className="font-mono text-sm font-bold text-gray-900">
              {formatHoursMins(totalTrackedSeconds)}
            </span>
          </div>
        </div>

        {/* Overall Category Bar */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          {isLoading ? (
            <div className="h-5 w-full animate-pulse rounded-full bg-gray-100" />
          ) : totalTrackedSeconds > 0 ? (
            <div className="space-y-3">
              {/* Progress track */}
              <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
                {categoryBreakdown
                  .filter((cat) => cat.durationSeconds > 0)
                  .map((cat, idx, arr) => {
                    const isFirst = idx === 0;
                    const isLast = idx === arr.length - 1;
                    const widthPercent =
                      totalTrackedSeconds > 0
                        ? (cat.durationSeconds / totalTrackedSeconds) * 100
                        : 0;

                    return (
                      <div
                        key={cat.id}
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: cat.color,
                        }}
                        title={`${cat.name}: ${cat.hours}h (${cat.percentage}%)`}
                        className={`h-full transition-all duration-300 hover:opacity-90 ${
                          isFirst && isLast
                            ? "rounded-full"
                            : isFirst
                              ? "rounded-l-full"
                              : isLast
                                ? "rounded-r-full"
                                : ""
                        }`}
                      />
                    );
                  })}
              </div>

              {/* Legend pills */}
              <div className="flex flex-wrap gap-2">
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-800 transition hover:border-gray-300"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                    <span className="font-bold text-gray-500">
                      {cat.percentage}%
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({formatHoursMins(cat.durationSeconds)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-11 w-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-xs text-gray-400">
              No activity recorded for {formattedDateTitle}
            </div>
          )}
        </div>
      </div>

      {/* 2. Loading / Error / Activity Bars for Each Category */}
      {isLoading ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center space-y-4 rounded-3xl border border-gray-200 bg-white p-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">
            Calculating statistics for {formattedDateTitle}...
          </p>
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm font-medium text-red-700">
          Failed to load statistics for this date. Please try again.
        </div>
      ) : totalTrackedSeconds === 0 ? null : (
        <div className="space-y-4">
          {categoryBreakdown.map((cat) => {
            const activities = cat.activities || [];
            const hasActivities = activities.length > 0;

            return (
              <div
                key={cat.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs transition sm:p-6"
              >
                {/* Category Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                      {cat.name}
                    </h2>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      {cat.percentage}% of day
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-lg font-black text-gray-900 sm:text-xl">
                      {formatHoursMins(cat.durationSeconds)}
                    </span>
                    {cat.durationSeconds >= 60 && (
                      <span className="text-xs font-medium text-gray-400">
                        ({cat.hours}h)
                      </span>
                    )}
                  </div>
                </div>

                {/* Activity Bar (Proportional to this Category) */}
                <div className="pt-4">
                  {hasActivities ? (
                    <div className="space-y-3">
                      {/* Segmented Activity Track for this Category */}
                      <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
                        {activities
                          .filter((act) => act.durationSeconds > 0)
                          .map((act, idx, arr) => {
                            const actColor =
                              act.color ||
                              (arr.length === 1
                                ? cat.color
                                : ACTIVITY_PALETTE[
                                    idx % ACTIVITY_PALETTE.length
                                  ]);

                            const actCategoryPercent =
                              cat.durationSeconds > 0
                                ? Math.round(
                                    (act.durationSeconds /
                                      cat.durationSeconds) *
                                      100
                                  )
                                : 0;

                            const actWidthPercent =
                              cat.durationSeconds > 0
                                ? (act.durationSeconds / cat.durationSeconds) *
                                  100
                                : 0;

                            const isFirst = idx === 0;
                            const isLast = idx === arr.length - 1;

                            return (
                              <div
                                key={act.id}
                                style={{
                                  width: `${actWidthPercent}%`,
                                  backgroundColor: actColor,
                                }}
                                title={`${act.name}: ${formatHoursMins(
                                  act.durationSeconds
                                )} (${actCategoryPercent}%)`}
                                className={`h-full transition-all duration-300 hover:opacity-90 ${
                                  isFirst && isLast
                                    ? "rounded-full"
                                    : isFirst
                                      ? "rounded-l-full"
                                      : isLast
                                        ? "rounded-r-full"
                                        : ""
                                }`}
                              />
                            );
                          })}
                      </div>

                      {/* Activity Legend Pills */}
                      <div className="flex flex-wrap gap-2">
                        {activities.map((act, idx) => {
                          const actColor =
                            act.color ||
                            (activities.length === 1
                              ? cat.color
                              : ACTIVITY_PALETTE[
                                  idx % ACTIVITY_PALETTE.length
                                ]);

                          const actCategoryPercent =
                            cat.durationSeconds > 0
                              ? Math.round(
                                  (act.durationSeconds / cat.durationSeconds) *
                                    100
                                )
                              : 0;

                          return (
                            <div
                              key={act.id}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-800 transition hover:border-gray-300"
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: actColor }}
                              />
                              <span>{act.name}</span>
                              <span className="font-bold text-gray-500">
                                {actCategoryPercent}%
                              </span>
                              <span className="text-[10px] text-gray-400">
                                ({formatHoursMins(act.durationSeconds)})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-10 w-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-xs text-gray-400">
                      No activities logged under this category.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
