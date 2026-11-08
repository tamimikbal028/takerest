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
  "সকাল নাস্তা",
  "দুপুর খাবার",
  "বিকাল নাস্তা",
  "রাত খাবার",
  "চা ও নাস্তা",
  "ধার পরিশোধ",
  "ডোনেশন",
  "ইন্টারনেট বিল",
  "ডাইনিং বিল",
] as const;

export const PAYMENT_METHODS = ["Cash", "bKash", "Rocket", "Other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const getCategoriesStorageKey = (userId: string) =>
  `takerest_finance_categories_v2_${userId}`;

const loadStoredCategories = (userId: string): string[] => {
  try {
    const raw = localStorage.getItem(getCategoriesStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to default
  }
  const defaults = [...EXPENSE_CATEGORIES];
  localStorage.setItem(getCategoriesStorageKey(userId), JSON.stringify(defaults));
  return defaults;
};

const saveStoredCategories = (userId: string, categories: string[]) => {
  localStorage.setItem(
    getCategoriesStorageKey(userId),
    JSON.stringify(categories)
  );
};

// 0. Category Management (Get, Create, Update/Rename, Delete)
const getFinanceCategories = async (): Promise<
  ApiResponse<{ categories: string[] }>
> => {
  const userId = await getActiveUserId();
  const categories = loadStoredCategories(userId);
  return {
    success: true,
    statusCode: 200,
    message: "Categories fetched",
    data: { categories },
  };
};

const createFinanceCategory = async (
  name: string
): Promise<ApiResponse<{ categories: string[]; category: string }>> => {
  const userId = await getActiveUserId();
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("খাতের নাম খালি রাখা যাবে না");
  }

  const current = loadStoredCategories(userId);
  if (current.includes(trimmed)) {
    throw new Error("এই খাতটি ইতিমধ্যে তালিকায় আছে");
  }

  const updated = [...current, trimmed];
  saveStoredCategories(userId, updated);

  return {
    success: true,
    statusCode: 201,
    message: "নতুন খাত যোগ করা হয়েছে",
    data: { categories: updated, category: trimmed },
  };
};

const updateFinanceCategory = async (payload: {
  oldName: string;
  newName: string;
}): Promise<ApiResponse<{ categories: string[]; category: string }>> => {
  const userId = await getActiveUserId();
  const oldTrimmed = payload.oldName.trim();
  const newTrimmed = payload.newName.trim();

  if (!newTrimmed) {
    throw new Error("খাতের নাম খালি রাখা যাবে না");
  }

  const current = loadStoredCategories(userId);
  if (oldTrimmed !== newTrimmed && current.includes(newTrimmed)) {
    throw new Error("এই নামের খাত ইতিমধ্যে আছে");
  }

  const updated = current.map((c) => (c === oldTrimmed ? newTrimmed : c));
  saveStoredCategories(userId, updated);

  // Also update existing transactions with this category in Supabase
  if (oldTrimmed !== newTrimmed) {
    await supabase
      .from("finance_transactions")
      .update({ category: newTrimmed, title: newTrimmed })
      .eq("user_id", userId)
      .eq("category", oldTrimmed);
  }

  return {
    success: true,
    statusCode: 200,
    message: "খাতের নাম পরিবর্তন করা হয়েছে",
    data: { categories: updated, category: newTrimmed },
  };
};

const deleteFinanceCategory = async (
  name: string
): Promise<ApiResponse<{ categories: string[] }>> => {
  const userId = await getActiveUserId();
  const current = loadStoredCategories(userId);
  const updated = current.filter((c) => c !== name);

  if (updated.length === 0) {
    throw new Error("অন্তত একটি খাত থাকতে হবে");
  }

  saveStoredCategories(userId, updated);

  return {
    success: true,
    statusCode: 200,
    message: "খাতটি মুছে ফেলা হয়েছে",
    data: { categories: updated },
  };
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
      title: payload.title?.trim() || payload.category,
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
  getFinanceCategories,
  createFinanceCategory,
  updateFinanceCategory,
  deleteFinanceCategory,
  getFinanceTransactions,
  createFinanceTransaction,
  updateFinanceTransaction,
  deleteFinanceTransaction,
  getFinanceSummary,
} as const;

export default financeServices;
