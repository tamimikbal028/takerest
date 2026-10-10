import { Clock, Layers, CheckCircle2, PieChart } from "lucide-react";
import type { DaySummary } from "@/types";

interface DaySummaryMetricsProps {
  summary?: DaySummary;
}

export const DaySummaryMetrics = ({ summary }: DaySummaryMetricsProps) => {
  const totalTrackedSeconds = summary?.totalTrackedSeconds ?? 0;

  const formatHoursMins = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const trackedPercentOf24h = Math.min(
    100,
    Math.round((totalTrackedSeconds / 86400) * 100)
  );

  const categoryBreakdown = summary?.categoryBreakdown ?? [];
  const totalSessions =
    summary?.totalLogsCount ??
    categoryBreakdown.reduce((acc, c) => acc + (c.logsCount || 0), 0);

  return (
    <div className="space-y-4">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Total Tracked Time */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Tracked Today
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
              ? `${trackedPercentOf24h}% of your 24h day covered`
              : "No time logged today yet"}
          </p>
        </div>

        {/* Completed Sessions */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Recorded Sessions
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-gray-900">
              {totalSessions}
            </span>
            <span className="text-xs font-medium text-gray-400">
              {totalSessions === 1 ? "session" : "sessions"}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            {totalSessions > 0
              ? "Completed time intervals"
              : "Start timer to record sessions"}
          </p>
        </div>

        {/* Categories Active */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Active Categories
            </span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-gray-900">
              {categoryBreakdown.length}
            </span>
            <span className="text-xs font-medium text-gray-400">
              {categoryBreakdown.length === 1 ? "category" : "categories"}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            {categoryBreakdown.length > 0
              ? "Different focus areas today"
              : "No categories recorded yet"}
          </p>
        </div>
      </div>

      {/* Category Distribution Pills */}
      {categoryBreakdown.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-1.5 pr-2 text-xs font-bold text-gray-600">
            <PieChart className="h-3.5 w-3.5" />
            <span>Categories:</span>
          </div>
          {categoryBreakdown.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold shadow-2xs"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-gray-900">{cat.name}:</span>
              <span className="text-gray-500">
                {cat.hours}h ({cat.percentage}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
