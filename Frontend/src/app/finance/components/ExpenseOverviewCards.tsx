import React from "react";
import {
  TrendingDown,
  Calendar,
  CalendarRange,
  PieChart,
} from "lucide-react";
import type { FinanceSummary } from "@/types";

interface ExpenseOverviewCardsProps {
  summary?: FinanceSummary;
  isLoading: boolean;
}

export const ExpenseOverviewCards: React.FC<ExpenseOverviewCardsProps> = ({
  summary,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-3xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  const todayExpense = summary?.todayExpense || 0;
  const weekExpense = summary?.weekExpense || 0;
  const monthExpense = summary?.monthExpense || 0;
  const topCategory = summary?.topExpenseCategory || "কোনো খরচ নেই";
  const topAmount = summary?.topExpenseAmount || 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* 1. Today's Expense */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-linear-to-br from-white via-amber-50/30 to-orange-50/40 p-4 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">আজকের খরচ (Today)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            ৳ {todayExpense.toLocaleString("en-IN")}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-amber-700">
            আজ সারাদিনের মোট খরচ
          </p>
        </div>
      </div>

      {/* 2. This Week's Expense */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-white via-blue-50/30 to-indigo-50/40 p-4 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">এই সপ্তাহে খরচ (Week)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <CalendarRange className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            ৳ {weekExpense.toLocaleString("en-IN")}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-blue-600">
            চলতি সপ্তাহের খরচ
          </p>
        </div>
      </div>

      {/* 3. This Month's Expense */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-linear-to-br from-white via-rose-50/30 to-red-50/40 p-4 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">এই মাসে খরচ (Month)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            ৳ {monthExpense.toLocaleString("en-IN")}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-rose-600">
            চলতি মাসের মোট খরচ
          </p>
        </div>
      </div>

      {/* 4. Top Category */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-emerald-50/30 to-teal-50/40 p-4 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">শীর্ষ খরচের খাত</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <PieChart className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="truncate text-base font-black tracking-tight text-gray-900 sm:text-lg">
            {topCategory}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
            {topAmount > 0 ? `৳ ${topAmount.toLocaleString("en-IN")}` : "কোনো খরচ নেই"}
          </p>
        </div>
      </div>
    </div>
  );
};
