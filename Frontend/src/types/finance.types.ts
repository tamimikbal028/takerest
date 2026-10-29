export type TransactionType = "EXPENSE" | "INCOME";

export interface FinanceTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  payment_method: string;
  date: string; // YYYY-MM-DD
  time?: string | null; // HH:MM:SS
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFinancePayload {
  title: string;
  amount: number;
  type?: TransactionType;
  category: string;
  payment_method?: string;
  date?: string;
  time?: string;
  notes?: string;
}

export interface UpdateFinancePayload {
  id: string;
  title?: string;
  amount?: number;
  type?: TransactionType;
  category?: string;
  payment_method?: string;
  date?: string;
  time?: string;
  notes?: string;
}

export interface FinanceCategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
}

export interface FinanceDailyPoint {
  date: string;
  dayLabel: string;
  expense: number;
  count: number;
}

export interface FinanceSummary {
  totalExpense: number;
  todayExpense: number;
  weekExpense: number;
  monthExpense: number;
  dailyAverage: number;
  transactionsCount: number;
  categoryBreakdown: FinanceCategorySummary[];
  dailyChart: FinanceDailyPoint[];
  topExpenseCategory: string | null;
  topExpenseAmount: number;
}
