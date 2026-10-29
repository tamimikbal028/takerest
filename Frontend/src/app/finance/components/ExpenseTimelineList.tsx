import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Coins,
} from "lucide-react";
import type { FinanceTransaction } from "@/types";
import { FINANCE_CATEGORY_COLORS } from "@/services/supabase/finance.supabase";

interface ExpenseTimelineListProps {
  transactions: FinanceTransaction[];
  isLoading: boolean;
  onEdit: (tx: FinanceTransaction) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const formatDisplayTime = (timeStr?: string | null): string => {
  if (!timeStr) return "";
  try {
    const [hh, mm] = timeStr.split(":");
    let h = parseInt(hh, 10);
    const m = mm || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
};

export const ExpenseTimelineList: React.FC<ExpenseTimelineListProps> = ({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats);
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedCategory !== "ALL" && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCat = t.category.toLowerCase().includes(q);
        const matchesMethod = t.payment_method?.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesMethod && !matchesNotes) return false;
      }
      return true;
    });
  }, [transactions, selectedCategory, searchQuery]);

  // Group by date (descending order)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, FinanceTransaction[]>();
    filtered.forEach((tx) => {
      const list = map.get(tx.date) || [];
      list.push(tx);
      map.set(tx.date, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Category Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 sm:text-sm">
              দৈনিক খরচের সময়ানুক্রমিক তালিকা (Expense Feed)
            </h3>
            <p className="text-[11px] text-gray-400">
              কোন দিন কখন কত টাকা খরচ হলো
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="খরচের বিবরণ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-1.5 pr-2.5 pl-8 text-xs font-semibold text-gray-800 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15"
            />
          </div>

          {availableCategories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 py-1.5 pr-6 pl-2.5 text-xs font-bold text-gray-700 transition hover:bg-white focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">সকল খাত (All)</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grouped by Day List */}
      {groupedByDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
            <Filter className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-bold text-gray-800">
            কোনো খরচের রেকর্ড পাওয়া যায়নি
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {searchQuery || selectedCategory !== "ALL"
              ? "ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।"
              : "নতুন খরচ যোগ করতে উপরের '+ নতুন খরচ যোগ করুন' বোতামে ক্লিক করুন।"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([date, items]) => {
            const dateObj = new Date(date);
            const todayStr = new Date().toISOString().split("T")[0];
            const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

            let dateLabel = dateObj.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            if (date === todayStr) {
              dateLabel = `আজকে (${dateLabel})`;
            } else if (date === yesterdayStr) {
              dateLabel = `গতকাল (${dateLabel})`;
            }

            // Total spent on this day
            const dayTotal = items.reduce((sum, item) => sum + Number(item.amount), 0);

            return (
              <div
                key={date}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xs"
              >
                {/* Date Header: KUNDIN + TOTAL SPENT */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-gray-900 sm:text-sm">
                      {dateLabel}
                    </span>
                    <span className="rounded-full bg-gray-200/60 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                      {items.length} টি খরচ
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-medium">দিনের মোট: </span>
                    <span className="text-xs font-black text-rose-600 sm:text-sm">
                      ৳{dayTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Items in this Day: KOKHN + KOTO TAKA + KEE KAJ */}
                <div className="divide-y divide-gray-100">
                  {items.map((tx) => {
                    const catColor = FINANCE_CATEGORY_COLORS[tx.category] || "#64748B";
                    const displayTime = formatDisplayTime(tx.time);

                    return (
                      <div
                        key={tx.id}
                        className="group flex items-center justify-between gap-3 p-3.5 transition hover:bg-gray-50/70 sm:p-4"
                      >
                        {/* Left: Time + Purpose */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Exact Time Badge (KOKHN) */}
                          <div className="flex flex-col items-center justify-center shrink-0 w-16 sm:w-20 rounded-xl bg-gray-100/80 py-1.5 px-1 border border-gray-200/60 text-center">
                            <Clock className="h-3 w-3 text-amber-600 mb-0.5" />
                            <span className="font-mono text-[11px] font-black tracking-tight text-gray-800">
                              {displayTime || "--:--"}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-900 sm:text-sm">
                                {tx.title}
                              </span>
                              <span
                                className="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                                style={{
                                  backgroundColor: `${catColor}15`,
                                  color: catColor,
                                }}
                              >
                                {tx.category}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-400 font-medium">
                              <span className="flex items-center gap-1 text-gray-500">
                                <CreditCard className="h-3 w-3 text-gray-400" />
                                {tx.payment_method || "Cash"}
                              </span>
                              {tx.notes && (
                                <span className="flex items-center gap-1 text-gray-500 italic max-w-xs truncate">
                                  • <FileText className="h-2.5 w-2.5 inline" /> {tx.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount (KOTO TAKA) & Quick Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-black tracking-tight text-rose-600 sm:text-base">
                              -৳{Number(tx.amount).toLocaleString("en-IN")}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => onEdit(tx)}
                              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-blue-600 active:scale-95"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => onDelete(tx.id)}
                              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
