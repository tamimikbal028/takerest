import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import goalServices from "@/services/supabase/goals.supabase";
import { GOAL_KEYS } from "@/constants/queryKeys";
import type {
  ApiResponse,
  DailyGoal,
  CreateGoalPayload,
  UpdateGoalPayload,
} from "@/types";

// 1. Get Goals for a Date
const useDailyGoals = (date: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<{ goals: DailyGoal[] }>
  >({
    queryKey: [GOAL_KEYS.GOALS, date],
    queryFn: () => goalServices.getGoalsByDate(date),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(date),
  });

  return {
    goals: data?.data?.goals ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
};

// 2. Create Goal Mutation
const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ goal: DailyGoal }>,
    Error,
    CreateGoalPayload
  >({
    mutationFn: (payload) => goalServices.createGoal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOAL_KEYS.GOALS] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create goal");
    },
  });
};

// 3. Update Goal Mutation
const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ goal: DailyGoal }>,
    Error,
    UpdateGoalPayload
  >({
    mutationFn: (payload) => goalServices.updateGoal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOAL_KEYS.GOALS] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update goal");
    },
  });
};

// 4. Delete Goal Mutation
const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ id: string }>, Error, string>({
    mutationFn: (id) => goalServices.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOAL_KEYS.GOALS] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete goal");
    },
  });
};

const goalHooks = {
  useDailyGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} as const;

export default goalHooks;

