import api from "@/config/axios";
import type {
  ApiResponse,
  Category,
  Activity,
  TimeLog,
  ActiveTimer,
  DaySummary,
} from "../types";

// 1. Categories
const getCategories = async (): Promise<
  ApiResponse<{ categories: Category[] }>
> => {
  const response = await api.get<ApiResponse<{ categories: Category[] }>>(
    "/tracker/categories"
  );
  return response.data;
};

const createCategory = async (
  categoryData: Partial<Category>
): Promise<ApiResponse<{ category: Category }>> => {
  const response = await api.post<ApiResponse<{ category: Category }>>(
    "/tracker/categories",
    categoryData
  );
  return response.data;
};

const updateCategory = async (
  id: string,
  categoryData: Partial<Category>
): Promise<ApiResponse<{ category: Category }>> => {
  const response = await api.put<ApiResponse<{ category: Category }>>(
    `/tracker/categories/${id}`,
    categoryData
  );
  return response.data;
};

const deleteCategory = async (
  id: string
): Promise<ApiResponse<{ deletedId: string }>> => {
  const response = await api.delete<ApiResponse<{ deletedId: string }>>(
    `/tracker/categories/${id}`
  );
  return response.data;
};

// 2. Activities
const createActivity = async (
  activityData: Partial<Activity>
): Promise<ApiResponse<{ activity: Activity }>> => {
  const response = await api.post<ApiResponse<{ activity: Activity }>>(
    "/tracker/activities",
    activityData
  );
  return response.data;
};

const updateActivity = async (
  id: string,
  activityData: Partial<Activity>
): Promise<ApiResponse<{ activity: Activity }>> => {
  const response = await api.put<ApiResponse<{ activity: Activity }>>(
    `/tracker/activities/${id}`,
    activityData
  );
  return response.data;
};

const deleteActivity = async (
  id: string
): Promise<ApiResponse<{ deletedId: string }>> => {
  const response = await api.delete<ApiResponse<{ deletedId: string }>>(
    `/tracker/activities/${id}`
  );
  return response.data;
};

// 3. Active Timer
const getActiveTimer = async (): Promise<
  ApiResponse<{ activeTimer: ActiveTimer }>
> => {
  const response = await api.get<ApiResponse<{ activeTimer: ActiveTimer }>>(
    "/tracker/timer/active"
  );
  return response.data;
};

interface SaveChunkPayload {
  title?: string;
  category_id?: string;
  activity_id?: string | null;
  is_wasted?: boolean;
  notes?: string | null;
}

const saveChunk = async (
  payload: SaveChunkPayload
): Promise<
  ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>
> => {
  const response = await api.post<
    ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>
  >("/tracker/timer/save-chunk", payload);
  return response.data;
};

interface SwitchTimerPayload {
  category_id: string;
  activity_id?: string | null;
  title?: string;
  save_previous?: boolean;
  previous_title?: string;
  previous_is_wasted?: boolean;
  previous_notes?: string | null;
}

const switchTimer = async (
  payload: SwitchTimerPayload
): Promise<
  ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>
> => {
  const response = await api.post<
    ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>
  >("/tracker/timer/switch", payload);
  return response.data;
};

// 4. Daily Logs & Summary
const getTodaySummary = async (
  date?: string
): Promise<ApiResponse<{ logs: TimeLog[]; summary: DaySummary }>> => {
  const response = await api.get<
    ApiResponse<{ logs: TimeLog[]; summary: DaySummary }>
  >("/tracker/summary", { params: { date } });
  return response.data;
};

const deleteTimeLog = async (
  id: string
): Promise<ApiResponse<{ deletedId: string }>> => {
  const response = await api.delete<ApiResponse<{ deletedId: string }>>(
    `/tracker/logs/${id}`
  );
  return response.data;
};

const trackerServices = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createActivity,
  updateActivity,
  deleteActivity,
  getActiveTimer,
  saveChunk,
  switchTimer,
  getTodaySummary,
  deleteTimeLog,
} as const;

export default trackerServices;
