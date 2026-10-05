import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import trackerServices from "@/services/trackerServices";
import { TRACKER_KEYS } from "@/constants/queryKeys";
import type {
  ApiResponse,
  Category,
  Activity,
  TimeLog,
  ActiveTimer,
  DaySummary,
} from "@/types";

// 1. Categories Hook
const useCategories = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<{ categories: Category[] }>
  >({
    queryKey: [TRACKER_KEYS.CATEGORIES],
    queryFn: () => trackerServices.getCategories(),
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  return {
    categories: data?.data?.categories ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
};

const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ category: Category }>,
    Error,
    Partial<Category>
  >({
    mutationFn: (categoryData) => trackerServices.createCategory(categoryData),
    onSuccess: () => {
      toast.success("Group created successfully");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.CATEGORIES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create group");
    },
  });
};

const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ category: Category }>,
    Error,
    { id: string; data: Partial<Category> }
  >({
    mutationFn: ({ id, data }) => trackerServices.updateCategory(id, data),
    onSuccess: () => {
      toast.success("Group updated");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.SUMMARY] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update group");
    },
  });
};

const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ deletedId: string }>, Error, string>({
    mutationFn: (id) => trackerServices.deleteCategory(id),
    onSuccess: () => {
      toast.success("Group removed");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.SUMMARY] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete group");
    },
  });
};

// 2. Activities Hooks
const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ activity: Activity }>,
    Error,
    Partial<Activity>
  >({
    mutationFn: (activityData) => trackerServices.createActivity(activityData),
    onSuccess: () => {
      toast.success("Activity added");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.CATEGORIES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add activity");
    },
  });
};

const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ activity: Activity }>,
    Error,
    { id: string; data: Partial<Activity> }
  >({
    mutationFn: ({ id, data }) => trackerServices.updateActivity(id, data),
    onSuccess: () => {
      toast.success("Activity updated");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.SUMMARY] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update activity");
    },
  });
};

const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ deletedId: string }>, Error, string>({
    mutationFn: (id) => trackerServices.deleteActivity(id),
    onSuccess: () => {
      toast.success("Activity removed");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.CATEGORIES] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove activity");
    },
  });
};

// 3. Active Continuous Timer Hook
const useActiveTimer = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<{ activeTimer: ActiveTimer }>
  >({
    queryKey: [TRACKER_KEYS.ACTIVE_TIMER],
    queryFn: () => trackerServices.getActiveTimer(),
    staleTime: 1000 * 30, // 30s
  });

  return {
    activeTimer: data?.data?.activeTimer,
    isLoading,
    isError,
    error,
    refetch,
  };
};

const useSaveChunk = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>,
    Error,
    {
      title?: string;
      category_id?: string;
      activity_id?: string | null;
      is_wasted?: boolean;
      notes?: string | null;
    }
  >({
    mutationFn: (chunkData) => trackerServices.saveChunk(chunkData),
    onSuccess: () => {
      toast.success("Log recorded!");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.ACTIVE_TIMER] });
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.SUMMARY] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save log");
    },
  });
};

const useSwitchTimer = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>,
    Error,
    {
      category_id: string;
      activity_id?: string | null;
      title?: string;
      save_previous?: boolean;
      previous_title?: string;
      previous_is_wasted?: boolean;
      previous_notes?: string | null;
    }
  >({
    mutationFn: (switchData) => trackerServices.switchTimer(switchData),
    onSuccess: () => {
      toast.success("Switched activity!");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.ACTIVE_TIMER] });
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.SUMMARY] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to switch activity");
    },
  });
};

// 4. Daily Summary & Logs Hook
const useDaySummary = (date?: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<{ logs: TimeLog[]; summary: DaySummary }>
  >({
    queryKey: [TRACKER_KEYS.SUMMARY, date],
    queryFn: () => trackerServices.getTodaySummary(date),
    staleTime: 1000 * 30, // 30s
  });

  return {
    logs: data?.data?.logs ?? [],
    summary: data?.data?.summary,
    isLoading,
    isError,
    error,
    refetch,
  };
};

const useDeleteTimeLog = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ deletedId: string }>, Error, string>({
    mutationFn: (id) => trackerServices.deleteTimeLog(id),
    onSuccess: () => {
      toast.success("Log removed");
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.SUMMARY] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete log");
    },
  });
};

const trackerHooks = {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useActiveTimer,
  useSaveChunk,
  useSwitchTimer,
  useDaySummary,
  useDeleteTimeLog,
} as const;

export default trackerHooks;
