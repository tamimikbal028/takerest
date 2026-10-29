import { useState, useMemo } from "react";
import { Coins, Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import financeHooks from "@/hooks/useFinance";
import { AddExpenseModal } from "./components/AddExpenseModal";
import { EditExpenseModal } from "./components/EditExpenseModal";
import { ExpenseOverviewCards } from "./components/ExpenseOverviewCards";
import { ExpenseChartBreakdown } from "./components/ExpenseChartBreakdown";
import { ExpenseTimelineList } from "./components/ExpenseTimelineList";
import type {
  FinanceTransaction,
  CreateFinancePayload,
  UpdateFinancePayload,
} from "@/types";

type PeriodType = "DAY" | "WEEK" | "MONTH" | "ALL";

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const FinancePage = () => {
  const [period, setPeriod] = useState<PeriodType>("DAY");
  const [currentDate, setCurrentDate] = useState<string>(() =>
    getLocalDateString()
  );

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<FinanceTransaction | null>(null);

  // Compute date ranges
  const dateRange = useMemo(() => {
    const d = new Date(currentDate);

    if (period === "DAY") {
      return {
        startDate: currentDate,
        endDate: currentDate,
        label: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    }

    if (period === "WEEK") {
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diffToMonday));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const sStr = getLocalDateString(start);
      const eStr = getLocalDateString(end);
      return {
        startDate: sStr,
        endDate: eStr,
        label: `${start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`,
      };
    }

    if (period === "MONTH") {
      const year = d.getFullYear();
      const month = d.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);

      return {
        startDate: getLocalDateString(start),
        endDate: getLocalDateString(end),
        label: start.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    }

    return {
      startDate: "2020-01-01",
      endDate: "2099-12-31",
      label: "All Time",
    };
  }, [period, currentDate]);

  // Fetch expenses and summary
  const { transactions, isLoading: isTxLoading } =
    financeHooks.useFinanceTransactions({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

  const { summary, isLoading: isSummaryLoading } =
    financeHooks.useFinanceSummary({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

  // Mutations
  const { mutate: createTransaction, isPending: isCreating } =
    financeHooks.useCreateFinanceTransaction();
  const { mutate: updateTransaction, isPending: isUpdating } =
    financeHooks.useUpdateFinanceTransaction();
  const { mutate: deleteTransaction, isPending: isDeleting } =
    financeHooks.useDeleteFinanceTransaction();

  // Navigation handlers
  const handleShiftDate = (direction: -1 | 1) => {
    const d = new Date(currentDate);
    if (period === "DAY") {
      d.setDate(d.getDate() + direction);
    } else if (period === "WEEK") {
      d.setDate(d.getDate() + direction * 7);
    } else if (period === "MONTH") {
      d.setMonth(d.getMonth() + direction);
    }
    setCurrentDate(getLocalDateString(d));
  };

  const handleResetToday = () => {
    setCurrentDate(getLocalDateString());
  };

  const handleCreateSubmit = (payload: CreateFinancePayload) => {
    createTransaction(payload, {
      onSuccess: () => {
        setIsAddModalOpen(false);
      },
    });
  };

  const handleUpdateSubmit = (payload: UpdateFinancePayload) => {
    updateTransaction(payload, {
      onSuccess: () => {
        setEditingTransaction(null);
      },
    });
  };

  const isToday = currentDate === getLocalDateString();

  return (
    <div className="space-y-5 pb-14">
      {/* 1. Header with Title & Add Expense CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Coins className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Expense Tracker
            </h1>
          </div>
        </div>

        {/* CTA: Add Expense Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition hover:bg-amber-700 active:scale-95 sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add new expense</span>
        </button>
      </div>

      {/* 2. Period Switcher & Date Navigation */}
      <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between sm:p-4">
        {/* Period Selector: Day, Week, Month, All */}
        <div className="flex items-center gap-1 rounded-2xl bg-gray-100 p-1">
          {(
            [
              { id: "DAY", label: "Day" },
              { id: "WEEK", label: "Week" },
              { id: "MONTH", label: "Month" },
              { id: "ALL", label: "All" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                period === p.id
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Navigation Controls */}
        {period !== "ALL" && (
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            {!isToday && (
              <button
                type="button"
                onClick={handleResetToday}
                className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 transition hover:bg-amber-100 active:scale-95"
              >
                Today
              </button>
            )}

            <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                title="Previous"
                className="cursor-pointer rounded-xl p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold text-gray-800">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                <span>{dateRange.label}</span>
              </div>

              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                title="Next"
                className="cursor-pointer rounded-xl p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900 active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Expense Overview Cards */}
      <ExpenseOverviewCards
        summary={summary}
        isLoading={isSummaryLoading || isTxLoading}
      />

      {/* 4. Visual Trend & Breakdown Chart */}
      <ExpenseChartBreakdown
        summary={summary}
        isLoading={isSummaryLoading || isTxLoading}
      />

      {/* 5. Expense Timeline / Feed */}
      <ExpenseTimelineList
        transactions={transactions}
        isLoading={isTxLoading}
        onEdit={(tx) => setEditingTransaction(tx)}
        onDelete={(id) => deleteTransaction(id)}
        isDeleting={isDeleting}
      />

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isPending={isCreating}
        initialDate={currentDate}
      />

      <EditExpenseModal
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleUpdateSubmit}
        isPending={isUpdating}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default FinancePage;
