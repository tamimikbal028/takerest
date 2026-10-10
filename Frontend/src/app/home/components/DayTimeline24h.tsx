import { Trash2, Calendar, Sun, Moon } from "lucide-react";
import trackerHooks from "@/hooks/useTracker";
import type { TimeLog } from "@/types";

interface DayTimeline24hProps {
  logs: TimeLog[];
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

export const DayTimeline24h = ({ logs }: DayTimeline24hProps) => {
  const { mutate: deleteTimeLog } = trackerHooks.useDeleteTimeLog();

  const formatHoursMins = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
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
      {/* Top Header: Title & Total Logs count */}
      <div className="flex items-center justify-between pb-3 sm:pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900 sm:text-base">
            Today's 24-Hour Timeline
          </h3>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
          {logs.length} {logs.length === 1 ? "log" : "logs"}
        </span>
      </div>

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
          <div className="relative mb-1.5 h-3.5 select-none text-[10px] font-bold text-gray-400">
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
                className="group absolute top-0 bottom-0 z-10 transition-all hover:shadow-xs hover:brightness-110"
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
          <div className="relative mb-1.5 h-3.5 select-none text-[10px] font-bold text-gray-400">
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
                className="group absolute top-0 bottom-0 z-10 cursor-pointer transition-all hover:shadow-xs hover:brightness-110"
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
        <div className="py-8 text-center text-xs font-medium text-gray-400">
          No logs recorded today yet. When you save chunks or switch activities,
          they will appear here seamlessly.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {logs.map((log) => {
            const categoryName = log.categories?.name || "Others";
            const categoryColor = log.categories?.color || "#64748B";

            const startTimeStr = new Date(log.started_at).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );
            const endTimeStr = new Date(log.ended_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-xl px-1.5 py-2.5 transition hover:bg-gray-50/80 sm:px-2 sm:py-3"
              >
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
                  <span className="font-mono text-xs font-bold text-gray-900 whitespace-nowrap sm:text-sm">
                    {formatHoursMins(log.duration_seconds)}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete log "${log.title}"?`)) {
                        deleteTimeLog(log.id);
                      }
                    }}
                    className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 active:scale-95 shrink-0"
                    title="Delete log"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
