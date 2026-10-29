import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import financeServices from "@/services/supabase/finance.supabase";
import { FINANCE_KEYS } from "@/constants/queryKeys";
import type {
  ApiResponse,
  FinanceTransaction,
  CreateFinancePayload,
  UpdateFinancePayload,
  FinanceSummary,
} from "@/types";

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
  useFinanceTransactions,
  useFinanceSummary,
  useCreateFinanceTransaction,
  useUpdateFinanceTransaction,
  useDeleteFinanceTransaction,
} as const;

export default financeHooks;
