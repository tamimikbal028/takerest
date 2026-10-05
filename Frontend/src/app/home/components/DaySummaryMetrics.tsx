import { Clock, AlertTriangle, CheckCircle, PieChart } from "lucide-react";
import type { DaySummary } from "@/types";

interface DaySummaryMetricsProps {
  summary?: DaySummary;
}

export const DaySummaryMetrics = ({ summary }: DaySummaryMetricsProps) => {
  const totalTrackedSeconds = summary?.totalTrackedSeconds ?? 0;
  const totalWastedSeconds = summary?.totalWastedSeconds ?? 0;
  const productiveSeconds = Math.max(0, totalTrackedSeconds - totalWastedSeconds);

  const formatHoursMins = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const wastedPercentage =
    totalTrackedSeconds > 0
      ? Math.round((totalWastedSeconds / totalTrackedSeconds) * 100)
      : 0;

  const categoryBreakdown = summary?.categoryBreakdown ?? [];

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
          <p className="mt-1 text-[11px] font-medium text-gray-500">Continuous day coverage</p>
        </div>

        {/* Productive / Useful Time */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Useful & Routine
            </span>
            <CheckCircle className="h-4 w-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-gray-900">
              {formatHoursMins(productiveSeconds)}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            {totalTrackedSeconds > 0
              ? `${100 - wastedPercentage}% of your day`
              : "No logs yet"}
          </p>
        </div>

        {/* Wasted Time Card (Highlights time waste per user requirement!) */}
        <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              Wasted Time Today
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-amber-950">
              {formatHoursMins(totalWastedSeconds)}
            </span>
            {totalWastedSeconds > 0 && (
              <span className="text-xs font-bold text-amber-700">
                ({wastedPercentage}%)
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] font-medium text-amber-900">
            {totalWastedSeconds > 0
              ? "Awareness is the first step to reclaiming time"
              : "0 minutes wasted! Perfect focus so far"}
          </p>
        </div>
      </div>

      {/* Category Distribution Pills */}
      {categoryBreakdown.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-1.5 pr-2 text-xs font-bold text-gray-600">
            <PieChart className="h-3.5 w-3.5" />
            <span>Groups:</span>
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
