import React, { useMemo } from "react";
import { Check, X } from "lucide-react";
import type { DailyGoal } from "@/types";

interface GoalSummaryBarProps {
  goals: DailyGoal[];
}

export const GoalSummaryBar: React.FC<GoalSummaryBarProps> = ({ goals }) => {
  const stats = useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter((g) => g.status === "ACHIEVED").length;
    const missed = goals.filter((g) => g.status === "MISSED").length;
    const pending = goals.filter((g) => g.status === "PENDING").length;
    const achievedPercent = total > 0 ? Math.round((achieved / total) * 100) : 0;
    const missedPercent = total > 0 ? Math.round((missed / total) * 100) : 0;
    return { total, achieved, missed, pending, achievedPercent, missedPercent };
  }, [goals]);

  if (stats.total === 0) return null;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-2xs sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-gray-700">
            মোট টার্গেট: <strong>{stats.total}টি</strong>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            পূরণ হয়েছে: {stats.achieved}টি
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-rose-700">
            <X className="h-3.5 w-3.5" />
            মিস হয়েছে: {stats.missed}টি
          </span>
          {stats.pending > 0 && (
            <span className="text-gray-500">বাকি আছে: {stats.pending}টি</span>
          )}
        </div>
        <span className="text-emerald-700">{stats.achievedPercent}% সফল</span>
      </div>

      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${stats.achievedPercent}%` }}
        />
        <div
          className="h-full bg-rose-500 transition-all duration-300"
          style={{ width: `${stats.missedPercent}%` }}
        />
      </div>
    </div>
  );
};

