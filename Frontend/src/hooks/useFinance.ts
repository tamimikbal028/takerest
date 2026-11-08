import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import financeServices, {
  EXPENSE_CATEGORIES,
} from "@/services/supabase/finance.supabase";
import { FINANCE_KEYS } from "@/constants/queryKeys";
import type {
  ApiResponse,
  FinanceTransaction,
  CreateFinancePayload,
  UpdateFinancePayload,
  FinanceSummary,
} from "@/types";

// 0. Categories Hook & Mutations
const useFinanceCategories = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<{ categories: string[] }>
  >({
    queryKey: [FINANCE_KEYS.CATEGORIES],
    queryFn: () => financeServices.getFinanceCategories(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    categories: data?.data?.categories ?? [...EXPENSE_CATEGORIES],
    isLoading,
    isError,
    error,
    refetch,
  };
};

const useCreateFinanceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ categories: string[]; category: string }>,
    Error,
    string
  >({
    mutationFn: (name) => financeServices.createFinanceCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.CATEGORIES] });
      toast.success("নতুন খাত যোগ করা হয়েছে");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add category");
    },
  });
};

const useUpdateFinanceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ categories: string[]; category: string }>,
    Error,
    { oldName: string; newName: string }
  >({
    mutationFn: (payload) => financeServices.updateFinanceCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.SUMMARY] });
      toast.success("খাতের নাম আপডেট করা হয়েছে");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update category");
    },
  });
};

const useDeleteFinanceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ categories: string[] }>, Error, string>({
    mutationFn: (name) => financeServices.deleteFinanceCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.CATEGORIES] });
      toast.success("খাতটি মুছে ফেলা হয়েছে");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete category");
    },
  });
};

// 1. Transactions List Hook
const useFinanceTransactions = (params?: {
  startDate?: string;
  endDate?: string;
  type?: string;
  category?: string;
}) => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<{ transactions: FinanceTransaction[] }>
  >({
    queryKey: [
      FINANCE_KEYS.TRANSACTIONS,
      params?.startDate,
      params?.endDate,
      params?.type,
      params?.category,
    ],
    queryFn: () => financeServices.getFinanceTransactions(params),
    staleTime: 1000 * 60 * 2, // 2 mins
  });

  return {
    transactions: data?.data?.transactions ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
};

// 2. Summary Hook
const useFinanceSummary = (params: { startDate: string; endDate: string }) => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<FinanceSummary>
  >({
    queryKey: [FINANCE_KEYS.SUMMARY, params.startDate, params.endDate],
    queryFn: () => financeServices.getFinanceSummary(params),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(params.startDate && params.endDate),
  });

  return {
    summary: data?.data,
    isLoading,
    isError,
    error,
    refetch,
  };
};

// 3. Create Transaction Mutation
const useCreateFinanceTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ transaction: FinanceTransaction }>,
    Error,
    CreateFinancePayload
  >({
    mutationFn: (payload) => financeServices.createFinanceTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.SUMMARY] });
      toast.success("খরচের হিসাব যোগ করা হয়েছে");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add transaction");
    },
  });
};

// 4. Update Transaction Mutation
const useUpdateFinanceTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ transaction: FinanceTransaction }>,
    Error,
    UpdateFinancePayload
  >({
    mutationFn: (payload) => financeServices.updateFinanceTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.SUMMARY] });
      toast.success("Transaction updated");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update transaction");
    },
  });
};

// 5. Delete Transaction Mutation
const useDeleteFinanceTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ id: string }>, Error, string>({
    mutationFn: (id) => financeServices.deleteFinanceTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [FINANCE_KEYS.SUMMARY] });
      toast.success("Transaction deleted");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete transaction");
    },
  });
};

const financeHooks = {
  useFinanceCategories,
  useCreateFinanceCategory,
  useUpdateFinanceCategory,
  useDeleteFinanceCategory,
  useFinanceTransactions,
  useFinanceSummary,
  useCreateFinanceTransaction,
  useUpdateFinanceTransaction,
  useDeleteFinanceTransaction,
} as const;

export default financeHooks;
