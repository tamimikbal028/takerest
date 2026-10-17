import { useState, useMemo } from "react";
import {
  Trash2,
  Calendar,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";
import trackerHooks from "@/hooks/useTracker";
import type { TimeLog, Category } from "@/types";
import { AddUntrackedLogModal } from "./AddUntrackedLogModal";

interface DayTimeline24hProps {
  logs: TimeLog[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  todayStr?: string;
  isLoading?: boolean;
  categories?: Category[];
}

interface BarSlice {
  logId: string;
  title: string;
  categoryName: string;
  color: string;
  leftPercent: number;
  widthPercent: number;
  durationMins: number;
}

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const DayTimeline24h = ({
  logs,
  selectedDate,
  onSelectDate,
  todayStr,
  isLoading,
  categories,
}: DayTimeline24hProps) => {
  const { mutate: deleteTimeLog } = trackerHooks.useDeleteTimeLog();
  const { categories: fetchedCategories } = trackerHooks.useCategories();
  const { activeTimer } = trackerHooks.useActiveTimer();
  const allCategories = categories || fetchedCategories || [];

  const [modalSlot, setModalSlot] = useState<{ start: Date; end: Date } | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const today = todayStr || getLocalDateString();
  const activeDate = selectedDate || today;
  const isToday = activeDate === today;

  const [yearNum, monthNum, dayNum] = activeDate.split("-").map(Number);
  const dateObj = new Date(yearNum, monthNum - 1, dayNum);

  const dayStart = useMemo(
    () => new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0, 0),
    [yearNum, monthNum, dayNum]
  );
  const dayEnd = useMemo(
    () => new Date(yearNum, monthNum - 1, dayNum + 1, 0, 0, 0, 0),
    [yearNum, monthNum, dayNum]
  );

  const upperBound = useMemo(() => {
    const now = new Date();
    if (isToday) {
      if (activeTimer?.is_running && activeTimer.started_at) {
        const timerStart = new Date(activeTimer.started_at).getTime();
        return new Date(Math.min(now.getTime(), timerStart));
      }
      return now;
    }
    return dayEnd;
  }, [isToday, activeTimer, dayEnd]);

  const formattedDateHeader = dateObj.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const formattedDateButton = dateObj.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleShiftDate = (days: number) => {
    if (!onSelectDate) return;
    const nextDateObj = new Date(yearNum, monthNum - 1, dayNum);
    nextDateObj.setDate(nextDateObj.getDate() + days);
    onSelectDate(getLocalDateString(nextDateObj));
  };

  // Sort logs in reverse chronological order (most recent on top)
  const sortedLogs = useMemo(() => {
    return [...logs].sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }, [logs]);

  const formatHoursMins = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const renderUntrackedGap = (
    gapStart: Date,
    gapEnd: Date,
    key: string
  ) => {
    const gapSeconds = Math.floor(
      (gapEnd.getTime() - gapStart.getTime()) / 1000
    );

    // Only show gap if >= 60 seconds (1 minute)
    if (gapSeconds < 60) return null;

    const gapStartStr = gapStart.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const gapEndStr = gapEnd.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const handleOpenModal = (e: React.MouseEvent) => {
      e.stopPropagation();
      setModalSlot({
        start: gapStart,
        end: gapEnd,
      });
      setIsModalOpen(true);
    };

    return (
      <div
        key={key}
        onClick={handleOpenModal}
        className="group my-1.5 flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border border-dashed border-gray-200/90 bg-gray-50/60 px-2.5 py-1.5 transition hover:border-blue-300 hover:bg-blue-50/30 sm:my-2 sm:px-3 sm:py-2"
        title="Click to add a log for this untracked slot"
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-200/70 text-gray-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600 sm:h-5.5 sm:w-5.5">
            <Clock className="h-3 w-3 text-gray-400 transition-colors group-hover:text-blue-600 sm:h-3.5 sm:w-3.5" />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-semibold text-gray-600 transition-colors group-hover:text-gray-900 sm:text-xs">
              Untracked Time
            </span>
            <span className="text-[10px] font-medium text-gray-400 sm:text-[11px]">
              ({gapStartStr} – {gapEndStr})
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[11px] font-bold text-gray-500 sm:text-xs">
            {formatHoursMins(gapSeconds)}
          </span>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-600 hover:text-white active:scale-95"
            title="Log time in this slot"
          >
            <Plus className="h-3 w-3" />
            <span>Add Log</span>
          </button>
        </div>
      </div>
    );
  };

  // Helper to slice logs into a 12-hour half (AM: 0-720 mins, PM: 720-1440 mins)
  const getSlicesForHalf = (
    barStartMins: number,
    barEndMins: number
  ): BarSlice[] => {
    const barTotalMins = barEndMins - barStartMins; // 720
    const slices: BarSlice[] = [];

    logs.forEach((log) => {
      const start = new Date(log.started_at);
      const end = new Date(log.ended_at);

      const startMinutes =
        start.getHours() * 60 + start.getMinutes() + start.getSeconds() / 60;
      let endMinutes =
        end.getHours() * 60 + end.getMinutes() + end.getSeconds() / 60;

      // Handle logs ending at midnight (00:00 next day)
      if (endMinutes <= startMinutes && end.getTime() > start.getTime()) {
        endMinutes = 1440;
      }

      // Check if log intersects this 12-hour bar
      if (endMinutes <= barStartMins || startMinutes >= barEndMins) {
        return;
      }

      const sliceStart = Math.max(startMinutes, barStartMins);
      const sliceEnd = Math.min(endMinutes, barEndMins);
      const durationMins = sliceEnd - sliceStart;

      if (durationMins > 0) {
        const leftPercent = ((sliceStart - barStartMins) / barTotalMins) * 100;
        const widthPercent = Math.max(0.6, (durationMins / barTotalMins) * 100);

        slices.push({
          logId: log.id,
          title: log.title,
          categoryName: log.categories?.name || "Others",
          color: log.categories?.color || "#3B82F6",
          leftPercent: Math.min(100, Math.max(0, leftPercent)),
          widthPercent: Math.min(100 - leftPercent, widthPercent),
          durationMins,
        });
      }
    });

    return slices;
  };

  const amSlices = getSlicesForHalf(0, 720);
  const pmSlices = getSlicesForHalf(720, 1440);

  return (
    <div className="relative z-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-xs sm:p-6">
      {/* Top Header: Title & Total Logs count + Date Controller */}
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
        <div className="flex items-center justify-between gap-2.5 sm:justify-start">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900 sm:text-base">
              {isToday
                ? "Today's 24-Hour Timeline"
                : `24-Hour Timeline • ${formattedDateHeader}`}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            {logs.length} {logs.length === 1 ? "log" : "logs"}
          </span>
        </div>

        {/* Date Selector Row */}
        {onSelectDate && (
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            {!isToday && (
              <button
                type="button"
                onClick={() => onSelectDate(today)}
                className="shrink-0 cursor-pointer rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95"
              >
                Today
              </button>
            )}

            <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                title="Previous Day"
                className="cursor-pointer rounded-xl p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Clickable Middle Date with native date picker */}
              <div className="group relative flex items-center rounded-xl transition hover:bg-white">
                <div className="flex cursor-pointer items-center gap-1.5 px-2.5 py-1 font-mono text-xs font-bold text-gray-800 transition group-hover:text-blue-700 sm:text-sm">
                  <span>{formattedDateButton}</span>
                </div>
                <input
                  type="date"
                  value={activeDate}
                  max={today}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {
                      // Fallback if showPicker is not supported in browser
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectDate(e.target.value);
                    }
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  title="Select Date"
                />
              </div>

              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                disabled={isToday}
                title="Next Day"
                className="cursor-pointer rounded-xl p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center space-y-3 py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-gray-400">
            Loading timeline logs...
          </p>
        </div>
      ) : (
        <>
          {/* 2-Bar Split Timeline (12h + 12h) */}
          <div className="mb-6 space-y-4">
            {/* Bar 1: AM Half (12:00 AM - 12:00 PM) */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Sun className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>1st Half: 12 AM – 12 PM</span>
                </div>
                <span className="rounded-md bg-amber-100/70 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {amSlices.length} {amSlices.length === 1 ? "log" : "logs"}
                </span>
              </div>

              {/* Hour markers */}
              <div className="relative mb-1.5 h-3.5 text-[10px] font-bold text-gray-400 select-none">
                <span className="absolute left-0">12 AM</span>
                <span className="absolute left-1/4 -translate-x-1/2">3 AM</span>
                <span className="absolute left-2/4 -translate-x-1/2">6 AM</span>
                <span className="absolute left-3/4 -translate-x-1/2">9 AM</span>
                <span className="absolute right-0">12 PM</span>
              </div>

              {/* Visual Track */}
              <div className="relative h-7 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-inner">
                {/* Hour grid lines (3 AM, 6 AM, 9 AM) */}
                <div
                  className="pointer-events-none absolute top-0 bottom-0 border-r border-dashed border-gray-200/80"
                  style={{ left: "25%" }}
                />
                <div
                  className="pointer-events-none absolute top-0 bottom-0 border-r border-dashed border-gray-200/80"
                  style={{ left: "50%" }}
                />
                <div
                  className="pointer-events-none absolute top-0 bottom-0 border-r border-dashed border-gray-200/80"
                  style={{ left: "75%" }}
                />

                {/* 3. Tracked Slices */}
                {amSlices.map((slice, idx) => (
                  <div
                    key={`${slice.logId}-am-${idx}`}
                    className="group absolute top-0 bottom-0 z-10 transition-all hover:shadow-xs hover:brightness-10"
                    style={{
                      left: `${slice.leftPercent}%`,
                      width: `${slice.widthPercent}%`,
                      backgroundColor: slice.color,
                    }}
                    title={`${slice.title} - ${slice.categoryName} (${formatHoursMins(Math.round(slice.durationMins * 60))})`}
                  />
                ))}
              </div>
            </div>

            {/* Bar 2: PM Half (12:00 PM - 12:00 AM) */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                  <Moon className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span>2nd Half: 12 PM – 12 AM</span>
                </div>
                <span className="rounded-md bg-indigo-100/70 px-2 py-0.5 text-xs font-bold text-indigo-800">
                  {pmSlices.length} {pmSlices.length === 1 ? "log" : "logs"}
                </span>
              </div>

              {/* Hour markers */}
              <div className="relative mb-1.5 h-3.5 text-[10px] font-bold text-gray-400 select-none">
                <span className="absolute left-0">12 PM</span>
                <span className="absolute left-1/4 -translate-x-1/2">3 PM</span>
                <span className="absolute left-2/4 -translate-x-1/2">6 PM</span>
                <span className="absolute left-3/4 -translate-x-1/2">9 PM</span>
                <span className="absolute right-0">12 AM</span>
              </div>

              {/* Visual Track */}
              <div className="relative h-7 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-inner">
                {/* Hour grid lines (3 PM, 6 PM, 9 PM) */}
                <div
                  className="pointer-events-none absolute top-0 bottom-0 border-r border-dashed border-gray-200/80"
                  style={{ left: "25%" }}
                />
                <div
                  className="pointer-events-none absolute top-0 bottom-0 border-r border-dashed border-gray-200/80"
                  style={{ left: "50%" }}
                />
                <div
                  className="pointer-events-none absolute top-0 bottom-0 border-r border-dashed border-gray-200/80"
                  style={{ left: "75%" }}
                />

                {/* Tracked Slices */}
                {pmSlices.map((slice, idx) => (
                  <div
                    key={`${slice.logId}-pm-${idx}`}
                    className="group absolute top-0 bottom-0 z-10 transition-all hover:shadow-xs hover:brightness-10"
                    style={{
                      left: `${slice.leftPercent}%`,
                      width: `${slice.widthPercent}%`,
                      backgroundColor: slice.color,
                    }}
                    title={`${slice.title} - ${slice.categoryName} (${formatHoursMins(Math.round(slice.durationMins * 60))})`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chronological Log History */}
          {logs.length === 0 ? (
            <div className="py-6 space-y-3">
              <div className="text-center text-xs font-medium text-gray-400">
                {isToday
                  ? "No logs recorded today yet. When you track time or add a manual log, it will appear here."
                  : `No logs recorded for ${formattedDateHeader}.`}
              </div>
              {renderUntrackedGap(dayStart, upperBound, "empty-day-gap")}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Gap after latest log (top of timeline) */}
              {renderUntrackedGap(
                new Date(sortedLogs[0].ended_at),
                upperBound,
                "latest-untracked-gap"
              )}

              {sortedLogs.map((log, index) => {
                const categoryName = log.categories?.name || "Others";
                const categoryColor = log.categories?.color || "#64748B";

                const startTimeStr = new Date(
                  log.started_at
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const endTimeStr = new Date(log.ended_at).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                // Compute gap between this log and the preceding chronological log (index + 1)
                const nextLog = sortedLogs[index + 1];
                const gapElement = nextLog
                  ? renderUntrackedGap(
                      new Date(nextLog.ended_at),
                      new Date(log.started_at),
                      `gap-${log.id}-${nextLog.id}`
                    )
                  : null;

                return (
                  <div key={log.id} className="py-0.5">
                    <div className="flex items-center justify-between gap-3 rounded-xl px-1.5 py-2.5 transition hover:bg-gray-50/80 sm:px-2 sm:py-3">
                      {/* Left side: indicator + title + details */}
                      <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                        {/* Category color bar / indicator */}
                        <span
                          className="h-8 w-1 shrink-0 rounded-full sm:h-9 sm:w-1.5"
                          style={{
                            backgroundColor: categoryColor,
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="truncate text-xs font-bold text-gray-900 sm:text-sm">
                              {log.title}
                            </span>
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase sm:px-2 sm:text-[10px]"
                              style={{ backgroundColor: categoryColor }}
                            >
                              {categoryName}
                            </span>
                          </div>
                          <p className="truncate text-[11px] font-medium text-gray-500 sm:text-xs">
                            <span>
                              {startTimeStr} - {endTimeStr}
                            </span>
                            {log.notes && <span> • {log.notes}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Right side: duration + delete action */}
                      <div className="flex shrink-0 items-center gap-2 pl-1 sm:gap-3 sm:pl-2">
                        <span className="font-mono text-xs font-bold whitespace-nowrap text-gray-900 sm:text-sm">
                          {formatHoursMins(log.duration_seconds)}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`Delete log "${log.title}"?`)) {
                              deleteTimeLog(log.id);
                            }
                          }}
                          className="shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 active:scale-95"
                          title="Delete log"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>

                    {gapElement}
                  </div>
                );
              })}

              {/* Gap before earliest log (bottom of timeline) */}
              {renderUntrackedGap(
                dayStart,
                new Date(sortedLogs[sortedLogs.length - 1].started_at),
                "earliest-untracked-gap"
              )}
            </div>
          )}
        </>
      )}

      {/* Untracked Log Modal */}
      {modalSlot && (
        <AddUntrackedLogModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalSlot(null);
          }}
          slotStart={modalSlot.start}
          slotEnd={modalSlot.end}
          activeDate={activeDate}
          categories={allCategories}
        />
      )}
    </div>
  );
};
