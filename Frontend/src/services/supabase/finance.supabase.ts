import { supabase, getActiveUserId } from "@/config/supabase";
import type {
  ApiResponse,
  FinanceTransaction,
  CreateFinancePayload,
  UpdateFinancePayload,
  FinanceSummary,
  FinanceCategorySummary,
  FinanceDailyPoint,
} from "@/types";

export const EXPENSE_CATEGORIES = [
  "খাবার",
  "মোবাইল রিচার্জ",
  "তালিমুদ্দীন বেতন",
  "ইন্টারনেট বিল",
  "ধার শোধ করা",
  "যাতায়াত",
  "অন্যান্য খরচ",
] as const;

export const FINANCE_CATEGORY_COLORS: Record<string, string> = {
  "খাবার": "#F59E0B",
  "মোবাইল রিচার্জ": "#06B6D4",
  "তালিমুদ্দীন বেতন": "#10B981",
  "ইন্টারনেট বিল": "#3B82F6",
  "ধার শোধ করা": "#EF4444",
  "যাতায়াত": "#8B5CF6",
  "অন্যান্য খরচ": "#64748B",
  // Legacy mappings for backwards compatibility
  "সকাল নাস্তা": "#F59E0B",
  "দুপুর খাবার": "#EA580C",
  "বিকাল নাস্তা": "#F97316",
  "রাত খাবার": "#8B5CF6",
  "চা ও নাস্তা": "#D97706",
  "খাবার ও নাস্তা (Food & Snacks)": "#F59E0B",
  "যাতায়াত ও ভাড়া (Transport / Commute)": "#8B5CF6",
  "বাজার ও মুদি (Groceries & Bazar)": "#10B981",
  "চা-পান ও রিফ্রেশমেন্ট (Tea & Snacks)": "#D97706",
  "মোবাইল রিচার্জ ও নেট (Mobile & Net)": "#06B6D4",
  "বিল ও ইউটিলিটি (Bills & Utilities)": "#EF4444",
  "ঔষধ ও চিকিৎসা (Medicine & Health)": "#14B8A6",
  "কেনাকাটা ও পোশাক (Shopping)": "#EC4899",
  "দান-সদকা (Charity / Sadaqah)": "#059669",
  "পরিবার ও ব্যক্তিগত (Family & Personal)": "#6366F1",
  "অন্যান্য খরচ (Others)": "#64748B",
};

// 1. Fetch Expenses directly from Supabase
const getFinanceTransactions = async (params?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}): Promise<ApiResponse<{ transactions: FinanceTransaction[] }>> => {
  const userId = await getActiveUserId();

  let query = supabase
    .from("finance_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("time", { ascending: false })
    .order("created_at", { ascending: false });

  if (params?.startDate) {
    query = query.gte("date", params.startDate);
  }
  if (params?.endDate) {
    query = query.lte("date", params.endDate);
  }
  if (params?.category && params.category !== "ALL") {
    query = query.eq("category", params.category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to fetch transactions");
  }

  return {
    success: true,
    statusCode: 200,
    message: "Fetched successfully",
    data: { transactions: (data as unknown as FinanceTransaction[]) || [] },
  };
};

// 2. Create Expense
const createFinanceTransaction = async (
  payload: CreateFinancePayload
): Promise<ApiResponse<{ transaction: FinanceTransaction }>> => {
  const userId = await getActiveUserId();
  const dateStr = payload.date || new Date().toISOString().split("T")[0];
  const timeStr =
    payload.time || new Date().toLocaleTimeString([], { hour12: false });

  const { data, error } = await supabase
    .from("finance_transactions")
    .insert({
      user_id: userId,
      title: payload.title.trim(),
      amount: Number(payload.amount),
      type: "EXPENSE",
      category: payload.category,
      payment_method: payload.payment_method || "Cash",
      date: dateStr,
      time: timeStr,
      notes: payload.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create transaction");
  }

  return {
    success: true,
    statusCode: 201,
    message: "খরচের হিসাব যোগ করা হয়েছে",
    data: { transaction: data as unknown as FinanceTransaction },
  };
};

// 3. Update Expense
const updateFinanceTransaction = async (
  payload: UpdateFinancePayload
): Promise<ApiResponse<{ transaction: FinanceTransaction }>> => {
  const userId = await getActiveUserId();

  const updateBody: Record<string, unknown> = {};
  if (payload.title !== undefined) updateBody.title = payload.title.trim();
  if (payload.amount !== undefined) updateBody.amount = Number(payload.amount);
  if (payload.category !== undefined) updateBody.category = payload.category;
  if (payload.payment_method !== undefined)
    updateBody.payment_method = payload.payment_method;
  if (payload.date !== undefined) updateBody.date = payload.date;
  if (payload.time !== undefined) updateBody.time = payload.time;
  if (payload.notes !== undefined)
    updateBody.notes = payload.notes?.trim() || null;

  const { data, error } = await supabase
    .from("finance_transactions")
    .update(updateBody)
    .eq("id", payload.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update transaction");
  }

  return {
    success: true,
    statusCode: 200,
    message: "খরচের হিসাব আপডেট করা হয়েছে",
    data: { transaction: data as unknown as FinanceTransaction },
  };
};

// 4. Delete Expense
const deleteFinanceTransaction = async (
  id: string
): Promise<ApiResponse<{ id: string }>> => {
  const userId = await getActiveUserId();

  const { error } = await supabase
    .from("finance_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to delete transaction");
  }

  return {
    success: true,
    statusCode: 200,
    message: "মুছে ফেলা হয়েছে",
    data: { id },
  };
};

// 5. Aggregate Summary for Expenses (Day, Week, Month)
const getFinanceSummary = async (params: {
  startDate: string;
  endDate: string;
}): Promise<ApiResponse<FinanceSummary>> => {
  const { data: res } = await getFinanceTransactions({
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const txs = res.transactions;
  let totalExpense = 0;

  const todayStr = new Date().toISOString().split("T")[0];

  // Today, Week, Month calculation helper
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setDate(diffToMonday))
    .toISOString()
    .split("T")[0];
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  let todayExpense = 0;
  let weekExpense = 0;
  let monthExpense = 0;

  const categoryMap: Record<string, { total: number; count: number }> = {};
  const dailyMap: Record<string, { expense: number; count: number }> = {};

  txs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    totalExpense += amt;

    if (tx.date === todayStr) {
      todayExpense += amt;
    }
    if (tx.date >= startOfWeek) {
      weekExpense += amt;
    }
    if (tx.date >= startOfMonth) {
      monthExpense += amt;
    }

    if (!categoryMap[tx.category]) {
      categoryMap[tx.category] = { total: 0, count: 0 };
    }
    categoryMap[tx.category].total += amt;
    categoryMap[tx.category].count += 1;

    if (!dailyMap[tx.date]) {
      dailyMap[tx.date] = { expense: 0, count: 0 };
    }
    dailyMap[tx.date].expense += amt;
    dailyMap[tx.date].count += 1;
  });

  const startD = new Date(params.startDate);
  const endD = new Date(params.endDate);
  const daysEvaluated = Math.max(
    1,
    Math.ceil(
      Math.abs(endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
  const dailyAverage =
    totalExpense > 0 ? Math.round(totalExpense / daysEvaluated) : 0;

  const categoryBreakdown: FinanceCategorySummary[] = Object.entries(
    categoryMap
  )
    .map(([category, stats]) => {
      const percentage =
        totalExpense > 0 ? (stats.total / totalExpense) * 100 : 0;
      return {
        category,
        total: stats.total,
        count: stats.count,
        percentage: Number(percentage.toFixed(1)),
        color: FINANCE_CATEGORY_COLORS[category] || "#64748B",
      };
    })
    .sort((a, b) => b.total - a.total);

  const dailyChart: FinanceDailyPoint[] = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => {
      const d = new Date(date);
      const dayLabel = d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      });
      return {
        date,
        dayLabel,
        expense: values.expense,
        count: values.count,
      };
    });

  const topExpense = categoryBreakdown[0] || null;

  return {
    success: true,
    statusCode: 200,
    message: "Summary calculated",
    data: {
      totalExpense,
      todayExpense,
      weekExpense,
      monthExpense,
      dailyAverage,
      transactionsCount: txs.length,
      categoryBreakdown,
      dailyChart,
      topExpenseCategory: topExpense ? topExpense.category : null,
      topExpenseAmount: topExpense ? topExpense.total : 0,
    },
  };
};

const financeServices = {
  getFinanceTransactions,
  createFinanceTransaction,
  updateFinanceTransaction,
  deleteFinanceTransaction,
  getFinanceSummary,
} as const;

export default financeServices;
