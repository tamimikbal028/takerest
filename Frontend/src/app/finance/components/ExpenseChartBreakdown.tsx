import React from "react";
import { BarChart3, PieChart } from "lucide-react";
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
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  const { dailyChart, categoryBreakdown, totalExpense } = summary;

  // Maximum daily expense for relative scaling
  const maxExpense = Math.max(...dailyChart.map((d) => d.expense), 100);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* 1. Daily Expense Trend Chart */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-gray-900">
              Daily Spending Trend
            </h3>
          </div>
          <span className="text-xs font-bold text-gray-400">
            Total: ৳{totalExpense.toLocaleString("en-IN")}
          </span>
        </div>

        {dailyChart.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center text-center text-xs text-gray-400">
            এই সময়ে কোনো খরচের তথ্য পাওয়া যায়নি।
          </div>
        ) : (
          <div className="flex h-48 items-end gap-2 overflow-x-auto pt-6 pb-2">
            {dailyChart.map((point) => {
              const heightPercent = Math.max(
                6,
                Math.round((point.expense / maxExpense) * 100)
              );

              return (
                <div
                  key={point.date}
                  className="group flex min-w-[38px] flex-1 flex-col items-center gap-1.5"
                >
                  <div className="relative flex h-36 w-full items-end justify-center">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-4 rounded-t-lg bg-amber-500 transition-all group-hover:scale-y-105 group-hover:bg-amber-600"
                      title={`${point.date}: ৳${point.expense} (${point.count} টি খরচ)`}
                    />
                  </div>
                  <span className="truncate text-[10px] font-bold text-gray-400">
                    {point.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Category Distribution */}
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
          <div className="flex h-44 flex-col items-center justify-center text-center text-xs text-gray-400">
            কোনো খরচের খাত পাওয়া যায়নি।
          </div>
        ) : (
          <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
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
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
