import { Trash2, Calendar } from "lucide-react";
import trackerHooks from "@/hooks/useTracker";
import type { TimeLog } from "@/types";

interface DayTimeline24hProps {
  logs: TimeLog[];
}

export const DayTimeline24h = ({ logs }: DayTimeline24hProps) => {
  const { mutate: deleteTimeLog } = trackerHooks.useDeleteTimeLog();

  const formatHoursMins = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  // Calculate percentage along the 24h bar (1440 mins total)
  const getLogBarPosition = (startedAt: string, endedAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(endedAt);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    const durationMins = Math.max(1, endMinutes - startMinutes);
    const leftPercent = Math.min(100, Math.max(0, (startMinutes / 1440) * 100));
    const widthPercent = Math.min(100 - leftPercent, Math.max(0.5, (durationMins / 1440) * 100));

    return { leftPercent, widthPercent };
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h3 className="font-bold text-gray-900">
            Today's 24-Hour Timeline
          </h3>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          {logs.length} {logs.length === 1 ? "log" : "logs"} today
        </span>
      </div>

      {/* 24-Hour Continuous Visual Bar */}
      <div className="relative mb-6">
        {/* Hour markers */}
        <div className="mb-1 flex justify-between text-[10px] font-bold text-gray-400">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>

        {/* Visual Bar Track */}
        <div className="relative h-6 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          {logs.map((log) => {
            const { leftPercent, widthPercent } = getLogBarPosition(
              log.started_at,
              log.ended_at
            );
            const color = log.categories?.color || "#3B82F6";

            return (
              <div
                key={log.id}
                className="group absolute top-0 bottom-0 transition-opacity hover:opacity-80"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: color,
                }}
                title={`${log.title} (${formatHoursMins(log.duration_seconds)})`}
              />
            );
          })}
        </div>
      </div>

      {/* Chronological Log History */}
      {logs.length === 0 ? (
        <div className="py-8 text-center text-xs font-medium text-gray-400">
          No logs recorded today yet. When you save chunks or switch activities, they will appear here seamlessly.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {logs.map((log) => {
            const categoryName = log.categories?.name || "Others";
            const categoryColor = log.categories?.color || "#64748B";

            const startTimeStr = new Date(log.started_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const endTimeStr = new Date(log.ended_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl px-2 py-3 transition hover:bg-gray-50/80"
              >
                <div className="flex items-center gap-3">
                  {/* Category color bar / indicator */}
                  <span
                    className="h-9 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: categoryColor,
                    }}
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {log.title}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {categoryName}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {startTimeStr} - {endTimeStr}
                      {log.notes ? ` • ${log.notes}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-gray-900">
                    {formatHoursMins(log.duration_seconds)}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete log "${log.title}"?`)) {
                        deleteTimeLog(log.id);
                      }
                    }}
                    className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete log"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
