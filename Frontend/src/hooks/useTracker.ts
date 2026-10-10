import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  supabaseGetCategories,
  supabaseCreateCategory,
  supabaseUpdateCategory,
  supabaseDeleteCategory,
} from "@/services/supabase/categories.supabase";
import {
  supabaseCreateActivity,
  supabaseUpdateActivity,
  supabaseDeleteActivity,
} from "@/services/supabase/activities.supabase";
import {
  supabaseGetActiveTimer,
  supabaseSaveChunk,
  supabaseSwitchTimer,
  supabaseStartTimer,
  supabaseStopTimer,
} from "@/services/supabase/timer.supabase";
import {
  supabaseGetTodaySummary,
  supabaseDeleteTimeLog,
} from "@/services/supabase/logs.supabase";
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
    queryFn: () => supabaseGetCategories(),
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
    mutationFn: (categoryData) => supabaseCreateCategory(categoryData),
    onSuccess: () => {
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
    mutationFn: ({ id, data }) => supabaseUpdateCategory(id, data),
    onSuccess: () => {
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
    mutationFn: (id) => supabaseDeleteCategory(id),
    onSuccess: () => {
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
    mutationFn: (activityData) => supabaseCreateActivity(activityData),
    onSuccess: () => {
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
    mutationFn: ({ id, data }) => supabaseUpdateActivity(id, data),
    onSuccess: () => {
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
    mutationFn: (id) => supabaseDeleteActivity(id),
    onSuccess: () => {
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
    queryFn: () => supabaseGetActiveTimer(),
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
      notes?: string | null;
    }
  >({
    mutationFn: (chunkData) => supabaseSaveChunk(chunkData),
    onSuccess: () => {
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
      previous_notes?: string | null;
    }
  >({
    mutationFn: (switchData) => supabaseSwitchTimer(switchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.ACTIVE_TIMER] });
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.SUMMARY] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to switch activity");
    },
  });
};

const useStartTimer = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ activeTimer: ActiveTimer }>,
    Error,
    {
      category_id?: string;
      activity_id?: string | null;
      title?: string;
    }
  >({
    mutationFn: (startData) => supabaseStartTimer(startData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.ACTIVE_TIMER] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start timer");
    },
  });
};

const useStopTimer = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>,
    Error,
    | {
        notes?: string | null;
        title?: string;
      }
    | undefined
  >({
    mutationFn: (stopData) => supabaseStopTimer(stopData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.ACTIVE_TIMER] });
      queryClient.invalidateQueries({ queryKey: [TRACKER_KEYS.SUMMARY] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to stop timer");
    },
  });
};

// 4. Daily Summary & Logs Hook
const useDaySummary = (date?: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ApiResponse<{ logs: TimeLog[]; summary: DaySummary }>
  >({
    queryKey: [TRACKER_KEYS.SUMMARY, date],
    queryFn: () => supabaseGetTodaySummary(date),
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
    mutationFn: (id) => supabaseDeleteTimeLog(id),
    onSuccess: () => {
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
  useStartTimer,
  useStopTimer,
  useSaveChunk,
  useSwitchTimer,
  useDaySummary,
  useDeleteTimeLog,
} as const;

export default trackerHooks;
