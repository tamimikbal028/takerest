import React from "react";
import { PieChart } from "lucide-react";
import type { FinanceSummary } from "@/types";

interface ExpenseChartBreakdownProps {
  summary?: FinanceSummary;
  isLoading: boolean;
}

export const ExpenseChartBreakdown: React.FC<ExpenseChartBreakdownProps> = ({
  summary,
  isLoading,
}) => {
  if (isLoading || !summary) {
    return <div className="h-44 animate-pulse rounded-3xl bg-gray-100" />;
  }

  const { categoryBreakdown } = summary;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">
            Category Breakdown
          </h3>
        </div>
        <span className="text-xs font-bold text-gray-400">
          {categoryBreakdown.length} টি খাত
        </span>
      </div>

      {categoryBreakdown.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center text-center text-xs text-gray-400">
          কোনো খরচের খাত পাওয়া যায়নি।
        </div>
      ) : (
        <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
          {categoryBreakdown.map((cat) => (
            <div key={cat.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-bold text-gray-800">
                    {cat.category}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400">
                    ({cat.count} টি)
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-bold text-gray-900">
                    ৳{cat.total.toLocaleString("en-IN")}
                  </span>
                  <span className="w-10 text-right text-[11px] font-semibold text-gray-500">
                    {cat.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-800 transition-all duration-300"
                  style={{
                    width: `${cat.percentage}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
