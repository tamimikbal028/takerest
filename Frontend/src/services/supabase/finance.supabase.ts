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

const LOCAL_STORAGE_KEY = "takerest_daily_expenses_store";

export const EXPENSE_CATEGORIES = [
  "খাবার ও নাস্তা (Food & Snacks)",
  "যাতায়াত ও ভাড়া (Transport / Commute)",
  "বাজার ও মুদি (Groceries & Bazar)",
  "চা-পান ও রিফ্রেশমেন্ট (Tea & Snacks)",
  "মোবাইল রিচার্জ ও নেট (Mobile & Net)",
  "বিল ও ইউটিলিটি (Bills & Utilities)",
  "ঔষধ ও চিকিৎসা (Medicine & Health)",
  "কেনাকাটা ও পোশাক (Shopping)",
  "দান-সদকা (Charity / Sadaqah)",
  "পরিবার ও ব্যক্তিগত (Family & Personal)",
  "অন্যান্য খরচ (Others)",
] as const;

export const FINANCE_CATEGORY_COLORS: Record<string, string> = {
  "খাবার ও নাস্তা (Food & Snacks)": "#F59E0B", // Amber
  "যাতায়াত ও ভাড়া (Transport / Commute)": "#3B82F6", // Blue
  "বাজার ও মুদি (Groceries & Bazar)": "#10B981", // Emerald
  "চা-পান ও রিফ্রেশমেন্ট (Tea & Snacks)": "#D97706", // Warm amber
  "মোবাইল রিচার্জ ও নেট (Mobile & Net)": "#06B6D4", // Cyan
  "বিল ও ইউটিলিটি (Bills & Utilities)": "#EF4444", // Red
  "ঔষধ ও চিকিৎসা (Medicine & Health)": "#14B8A6", // Teal
  "কেনাকাটা ও পোশাক (Shopping)": "#EC4899", // Pink
  "দান-সদকা (Charity / Sadaqah)": "#059669", // Dark Emerald
  "পরিবার ও ব্যক্তিগত (Family & Personal)": "#6366F1", // Indigo
  "অন্যান্য খরচ (Others)": "#64748B", // Slate
};

// Seed realistic daily demo expenses with exact times
const getInitialLocalData = (userId: string): FinanceTransaction[] => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split("T")[0];

  return [
    {
      id: "exp_1",
      user_id: userId,
      title: "সকালের নাস্তা ও চা",
      amount: 45,
      type: "EXPENSE",
      category: "চা-পান ও রিফ্রেশমেন্ট (Tea & Snacks)",
      payment_method: "Cash",
      date: today,
      time: "08:45:00",
      notes: "পরাটা ও চা",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "exp_2",
      user_id: userId,
      title: "অফিস যাতায়াত রিকশা ভাড়া",
      amount: 60,
      type: "EXPENSE",
      category: "যাতায়াত ও ভাড়া (Transport / Commute)",
      payment_method: "Cash",
      date: today,
      time: "09:30:00",
      notes: "ধানমন্ডি থেকে ফার্মগেট",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "exp_3",
      user_id: userId,
      title: "দুপুরের লাঞ্চ",
      amount: 170,
      type: "EXPENSE",
      category: "খাবার ও নাস্তা (Food & Snacks)",
      payment_method: "bKash",
      date: today,
      time: "13:45:00",
      notes: "ভাত, মাছ ও ডাল",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "exp_4",
      user_id: userId,
      title: "বিকালের চা ও বিস্কুট",
      amount: 30,
      type: "EXPENSE",
      category: "চা-পান ও রিফ্রেশমেন্ট (Tea & Snacks)",
      payment_method: "Cash",
      date: yesterday,
      time: "17:15:00",
      notes: "সহকর্মীদের সাথে",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "exp_5",
      user_id: userId,
      title: "কাঁচাবাজার ও ডিম",
      amount: 420,
      type: "EXPENSE",
      category: "বাজার ও মুদি (Groceries & Bazar)",
      payment_method: "Cash",
      date: yesterday,
      time: "19:30:00",
      notes: "সাপ্তাহিক বাজার",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "exp_6",
      user_id: userId,
      title: "মোবাইল ডাটা রিচার্জ",
      amount: 120,
      type: "EXPENSE",
      category: "মোবাইল রিচার্জ ও নেট (Mobile & Net)",
      payment_method: "bKash",
      date: twoDaysAgo,
      time: "11:20:00",
      notes: "ইন্টারনেট প্যাক",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
};

const getLocalTransactions = (userId: string): FinanceTransaction[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    if (!raw) {
      const initial = getInitialLocalData(userId);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveLocalTransactions = (userId: string, data: FinanceTransaction[]) => {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save local expense data:", err);
  }
};

// 1. Fetch Expenses
const getFinanceTransactions = async (params?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}): Promise<ApiResponse<{ transactions: FinanceTransaction[] }>> => {
  let userId: string;
  try {
    userId = await getActiveUserId();
  } catch {
    userId = "guest_user";
  }

  try {
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
      // Fallback to local storage seamlessly
      const local = getLocalTransactions(userId);
      let filtered = local;
      if (params?.startDate) {
        filtered = filtered.filter((t) => t.date >= params.startDate!);
      }
      if (params?.endDate) {
        filtered = filtered.filter((t) => t.date <= params.endDate!);
      }
      if (params?.category && params.category !== "ALL") {
        filtered = filtered.filter((t) => t.category === params.category);
      }
      // Sort by date desc, time desc
      filtered.sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date);
        if (dateDiff !== 0) return dateDiff;
        return (b.time || "").localeCompare(a.time || "");
      });

      return {
        success: true,
        statusCode: 200,
        message: "Loaded from local store",
        data: { transactions: filtered },
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Fetched successfully",
      data: { transactions: data || [] },
    };
  } catch {
    const local = getLocalTransactions(userId);
    return {
      success: true,
      statusCode: 200,
      message: "Loaded fallback",
      data: { transactions: local },
    };
  }
};

// 2. Create Expense
const createFinanceTransaction = async (
  payload: CreateFinancePayload
): Promise<ApiResponse<{ transaction: FinanceTransaction }>> => {
  const userId = await getActiveUserId();
  const dateStr = payload.date || new Date().toISOString().split("T")[0];
  const timeStr = payload.time || new Date().toLocaleTimeString([], { hour12: false });

  try {
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
      const newTx: FinanceTransaction = {
        id: "exp_" + Date.now(),
        user_id: userId,
        title: payload.title.trim(),
        amount: Number(payload.amount),
        type: "EXPENSE",
        category: payload.category,
        payment_method: payload.payment_method || "Cash",
        date: dateStr,
        time: timeStr,
        notes: payload.notes?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const list = getLocalTransactions(userId);
      list.unshift(newTx);
      saveLocalTransactions(userId, list);

      return {
        success: true,
        statusCode: 201,
        message: "Saved locally (Supabase table not detected)",
        data: { transaction: newTx },
      };
    }

    return {
      success: true,
      statusCode: 201,
      message: "খরচের হিসাব যোগ করা হয়েছে",
      data: { transaction: data },
    };
  } catch {
    const newTx: FinanceTransaction = {
      id: "exp_" + Date.now(),
      user_id: userId,
      title: payload.title.trim(),
      amount: Number(payload.amount),
      type: "EXPENSE",
      category: payload.category,
      payment_method: payload.payment_method || "Cash",
      date: dateStr,
      time: timeStr,
      notes: payload.notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = getLocalTransactions(userId);
    list.unshift(newTx);
    saveLocalTransactions(userId, list);

    return {
      success: true,
      statusCode: 201,
      message: "Saved locally",
      data: { transaction: newTx },
    };
  }
};

// 3. Update Expense
const updateFinanceTransaction = async (
  payload: UpdateFinancePayload
): Promise<ApiResponse<{ transaction: FinanceTransaction }>> => {
  const userId = await getActiveUserId();

  try {
    const updateBody: Record<string, unknown> = {};
    if (payload.title !== undefined) updateBody.title = payload.title.trim();
    if (payload.amount !== undefined) updateBody.amount = Number(payload.amount);
    if (payload.category !== undefined) updateBody.category = payload.category;
    if (payload.payment_method !== undefined)
      updateBody.payment_method = payload.payment_method;
    if (payload.date !== undefined) updateBody.date = payload.date;
    if (payload.time !== undefined) updateBody.time = payload.time;
    if (payload.notes !== undefined) updateBody.notes = payload.notes?.trim() || null;

    const { data, error } = await supabase
      .from("finance_transactions")
      .update(updateBody)
      .eq("id", payload.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      const list = getLocalTransactions(userId);
      const index = list.findIndex((t) => t.id === payload.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updateBody, updated_at: new Date().toISOString() };
        saveLocalTransactions(userId, list);
        return {
          success: true,
          statusCode: 200,
          message: "Updated locally",
          data: { transaction: list[index] },
        };
      }
      throw new Error("Transaction not found");
    }

    return {
      success: true,
      statusCode: 200,
      message: "খরচের হিসাব আপডেট করা হয়েছে",
      data: { transaction: data },
    };
  } catch (err: unknown) {
    const list = getLocalTransactions(userId);
    const index = list.findIndex((t) => t.id === payload.id);
    if (index !== -1) {
      list[index] = { ...list[index], ...payload, updated_at: new Date().toISOString() } as FinanceTransaction;
      saveLocalTransactions(userId, list);
      return {
        success: true,
        statusCode: 200,
        message: "Updated locally",
        data: { transaction: list[index] },
      };
    }
    throw err;
  }
};

// 4. Delete Expense
const deleteFinanceTransaction = async (
  id: string
): Promise<ApiResponse<{ id: string }>> => {
  const userId = await getActiveUserId();

  try {
    const { error } = await supabase
      .from("finance_transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      const list = getLocalTransactions(userId).filter((t) => t.id !== id);
      saveLocalTransactions(userId, list);
      return {
        success: true,
        statusCode: 200,
        message: "Deleted locally",
        data: { id },
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "মুছে ফেলা হয়েছে",
      data: { id },
    };
  } catch {
    const list = getLocalTransactions(userId).filter((t) => t.id !== id);
    saveLocalTransactions(userId, list);
    return {
      success: true,
      statusCode: 200,
      message: "Deleted locally",
      data: { id },
    };
  }
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
  const startOfWeek = new Date(now.setDate(diffToMonday)).toISOString().split("T")[0];
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  let todayExpense = 0;
  let weekExpense = 0;
  let monthExpense = 0;

  const categoryMap: Record<string, { total: number; count: number }> = {};
  const dailyMap: Record<string, { expense: number; count: number }> = {};

  txs.forEach((tx) => {
    const amt = Number(tx.amount);
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

    // Category
    if (!categoryMap[tx.category]) {
      categoryMap[tx.category] = { total: 0, count: 0 };
    }
    categoryMap[tx.category].total += amt;
    categoryMap[tx.category].count += 1;

    // Daily
    if (!dailyMap[tx.date]) {
      dailyMap[tx.date] = { expense: 0, count: 0 };
    }
    dailyMap[tx.date].expense += amt;
    dailyMap[tx.date].count += 1;
  });

  // Calculate days count
  const startD = new Date(params.startDate);
  const endD = new Date(params.endDate);
  const daysEvaluated = Math.max(1, Math.ceil(Math.abs(endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const dailyAverage = totalExpense > 0 ? Math.round(totalExpense / daysEvaluated) : 0;

  const categoryBreakdown: FinanceCategorySummary[] = Object.entries(categoryMap)
    .map(([category, stats]) => {
      const percentage = totalExpense > 0 ? (stats.total / totalExpense) * 100 : 0;
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
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
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
