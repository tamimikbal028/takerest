import { useState } from "react";
import trackerHooks from "@/hooks/useTracker";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  PieChart,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const StatisticsPage = () => {
  // Date state: YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const { summary, isLoading, isError } = trackerHooks.useDaySummary(selectedDate);
  const { categories } = trackerHooks.useCategories();

  // Selected Category ID for Single Category Activity Breakdown
  const [selectedCatId, setSelectedCatId] = useState<string>("");

  // Helper date shift
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const isToday = selectedDate === todayStr;

  const formatHoursMins = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const totalTrackedSeconds = summary?.totalTrackedSeconds ?? 0;
  const categoryBreakdown = summary?.categoryBreakdown ?? [];
  const totalSessions =
    summary?.totalLogsCount ??
    categoryBreakdown.reduce((acc, c) => acc + (c.logsCount || 0), 0);

  // Active or selected category for single category activity drill-down
  const activeCategoryId =
    selectedCatId ||
    categoryBreakdown[0]?.id ||
    categories[0]?.id ||
    "";

  // Find the selected category breakdown
  const selectedCategoryData = categoryBreakdown.find(
    (c) => c.id === activeCategoryId
  );

  // Selected category info from categories list if not present in breakdown
  const selectedCategoryInfo =
    selectedCategoryData || categories.find((c) => c.id === activeCategoryId);

  // Format date display (e.g., "Monday, Oct 6, 2026")
  const formattedDateTitle = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  // Find top category
  const topCategory = categoryBreakdown[0];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Date Controller */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-purple-600">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Analytics & Insights
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Time & Activity Statistics
          </h1>
          <p className="mt-0.5 text-xs font-medium text-gray-500">
            Detailed breakdown by Categories and individual Activities
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1 shadow-2xs">
            <button
              onClick={() => handleShiftDate(-1)}
              title="Previous Day"
              className="cursor-pointer rounded-xl p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold text-gray-800">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              <span>{formattedDateTitle}</span>
            </div>

            <button
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
              onClick={() => setSelectedDate(todayStr)}
              className="cursor-pointer rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-100 active:scale-95"
            >
              Today
            </button>
          )}

          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-purple-500 focus:outline-hidden"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 rounded-3xl border border-gray-200 bg-white p-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500">
            Calculating statistics for {formattedDateTitle}...
          </p>
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm font-medium text-red-700">
          Failed to load statistics for this date. Please try again.
        </div>
      ) : (
        <>
          {/* 2. Top Metric Highlights */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Tracked Time */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-blue-600">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Total Tracked
                </span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-gray-900">
                  {formatHoursMins(totalTrackedSeconds)}
                </span>
                <span className="text-xs font-medium text-gray-400">/ 24h</span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                {totalTrackedSeconds > 0
                  ? `${Math.round((totalTrackedSeconds / 86400) * 100)}% of 24h day`
                  : "No time logged"}
              </p>
            </div>

            {/* Total Sessions */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Total Sessions
                </span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-gray-900">
                  {totalSessions}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {totalSessions === 1 ? "log" : "logs"}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Completed time intervals
              </p>
            </div>

            {/* Active Categories Count */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-purple-600">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Active Categories
                </span>
                <PieChart className="h-4 w-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-gray-900">
                  {categoryBreakdown.length}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  / {categories.length} total
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Categories with records today
              </p>
            </div>

            {/* Top Category */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Top Focus Area
                </span>
                <Layers className="h-4 w-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="truncate text-2xl font-black text-gray-900">
                  {topCategory ? topCategory.name : "None"}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                {topCategory
                  ? `${formatHoursMins(topCategory.durationSeconds)} (${topCategory.percentage}%)`
                  : "No time logged today"}
              </p>
            </div>
          </div>

          {/* 3. Proportional Day Distribution Bar */}
          {totalTrackedSeconds > 0 && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Day Proportion Overview
                  </h3>
                </div>
                <span className="text-xs font-medium text-gray-500">
                  100% of tracked time ({formatHoursMins(totalTrackedSeconds)})
                </span>
              </div>

              {/* Progress track */}
              <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 p-0.5">
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                    title={`${cat.name}: ${cat.hours}h (${cat.percentage}%)`}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-90"
                  />
                ))}
              </div>

              {/* Legend pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-800"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                    <span className="font-bold text-gray-500">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. SECTION 1: CATEGORY-WISE STATS */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-col justify-between gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <PieChart className="h-3.5 w-3.5" />
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">
                    1. Category-Wise Statistics
                  </h2>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Total time distribution across all your categories for {formattedDateTitle}
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-400">
                {categoryBreakdown.length} active categories
              </span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="py-12 text-center text-xs font-medium text-gray-400">
                No activity logs recorded for {formattedDateTitle}.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryBreakdown.map((cat) => {
                  const isSelected = cat.id === activeCategoryId;
                  return (
                    <div
                      key={cat.id}
                      className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm font-bold text-gray-900">
                              {cat.name}
                            </span>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{
                              backgroundColor: `${cat.color}20`,
                              color: cat.color,
                            }}
                          >
                            {cat.percentage}% of day
                          </span>
                        </div>

                        {/* Duration Display */}
                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-gray-900">
                            {formatHoursMins(cat.durationSeconds)}
                          </span>
                          <span className="text-xs font-medium text-gray-400">
                            ({cat.hours}h)
                          </span>
                        </div>

                        {/* Horizontal Progress Bar */}
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>

                        <p className="mt-2 text-[11px] font-medium text-gray-400">
                          {cat.logsCount} {cat.logsCount === 1 ? "session" : "sessions"} recorded
                        </p>
                      </div>

                      {/* Inspect Activity button */}
                      <button
                        onClick={() => {
                          setSelectedCatId(cat.id);
                          // Scroll smoothly to section 2
                          const el = document.getElementById("activity-breakdown-section");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`mt-4 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span>{isSelected ? "Inspecting Activities" : "Inspect Activities"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. SECTION 2: SINGLE CATEGORY ACTIVITY-WISE STATS */}
          <div
            id="activity-breakdown-section"
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8"
          >
            <div className="flex flex-col justify-between gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Layers className="h-3.5 w-3.5" />
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">
                    2. Single Category: Activity-Wise Breakdown
                  </h2>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select a category to inspect the time spent on each individual activity
                </p>
              </div>

              {/* Category selector pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((c) => {
                  const isSelected = c.id === activeCategoryId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCatId(c.id)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                        isSelected
                          ? "bg-gray-900 text-white shadow-md"
                          : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Category Header Banner */}
            {selectedCategoryInfo && (
              <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: selectedCategoryInfo.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-gray-900">
                        {selectedCategoryInfo.name}
                      </h3>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: selectedCategoryInfo.color }}
                      >
                        Category
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Total Category Time:{" "}
                      <span className="font-bold text-gray-900">
                        {formatHoursMins(selectedCategoryData?.durationSeconds ?? 0)}
                      </span>{" "}
                      ({selectedCategoryData?.percentage ?? 0}% of today's total tracked time)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">
                    {(selectedCategoryData?.activities || []).length} tracked activities
                  </span>
                </div>
              </div>
            )}

            {/* Activities Breakdown Cards / List */}
            {(!selectedCategoryData || (selectedCategoryData.activities || []).length === 0) ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  No activity logs recorded under "{selectedCategoryInfo?.name || "this category"}" on {formattedDateTitle}.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Select another category or start a timer session on Home to log activities here.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {selectedCategoryData.activities?.map((act) => {
                  const catColor = selectedCategoryData.color || "#3B82F6";
                  return (
                    <div
                      key={act.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs transition hover:border-gray-300"
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: catColor }}
                          />
                          <div>
                            <span className="text-sm font-bold text-gray-900">
                              {act.name}
                            </span>
                            <span className="ml-2 text-xs font-medium text-gray-400">
                              {act.logsCount} {act.logsCount === 1 ? "session" : "sessions"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-black text-gray-900">
                            {formatHoursMins(act.durationSeconds)}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-bold"
                            style={{
                              backgroundColor: `${catColor}20`,
                              color: catColor,
                            }}
                          >
                            {act.percentage}% of {selectedCategoryData.name}
                          </span>
                        </div>
                      </div>

                      {/* Visual proportion bar for this activity */}
                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${act.percentage}%`,
                            backgroundColor: catColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
