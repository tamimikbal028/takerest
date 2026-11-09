import { supabase, getActiveUserId } from "@/config/supabase";
import type {
  ApiResponse,
  DailyGoal,
  CreateGoalPayload,
  UpdateGoalPayload,
} from "@/types";

// 1. Get Goals active on a specific date (start_date <= date AND end_date >= date)
const getGoalsByDate = async (
  date: string
): Promise<ApiResponse<{ goals: DailyGoal[] }>> => {
  const userId = await getActiveUserId();

  const { data, error } = await supabase
    .from("daily_goals")
    .select("*")
    .eq("user_id", userId)
    .lte("start_date", date)
    .gte("end_date", date)
    .order("start_time", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch goals");
  }

  return {
    success: true,
    statusCode: 200,
    message: "Goals fetched successfully",
    data: { goals: (data as unknown as DailyGoal[]) || [] },
  };
};

// 2. Create Goal
const createGoal = async (
  payload: CreateGoalPayload
): Promise<ApiResponse<{ goal: DailyGoal }>> => {
  const userId = await getActiveUserId();
  const trimmedTitle = payload.title.trim();

  if (!trimmedTitle) {
    throw new Error("টার্গেটের নাম খালি রাখা যাবে না");
  }

  const startDate = payload.start_date;
  const endDate =
    payload.end_date && payload.end_date >= startDate
      ? payload.end_date
      : startDate;

  const { data, error } = await supabase
    .from("daily_goals")
    .insert({
      user_id: userId,
      title: trimmedTitle,
      status: "PENDING",
      start_date: startDate,
      end_date: endDate,
      start_time: payload.start_time || null,
      end_time: payload.end_time || null,
      notes: payload.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create goal");
  }

  return {
    success: true,
    statusCode: 201,
    message: "Goal created",
    data: { goal: data as unknown as DailyGoal },
  };
};

// 3. Update Goal (Status / Title / Time / Dates / Notes)
const updateGoal = async (
  payload: UpdateGoalPayload
): Promise<ApiResponse<{ goal: DailyGoal }>> => {
  const userId = await getActiveUserId();

  const updateBody: Record<string, unknown> = {};
  if (payload.title !== undefined) updateBody.title = payload.title.trim();
  if (payload.status !== undefined) updateBody.status = payload.status;
  if (payload.start_date !== undefined)
    updateBody.start_date = payload.start_date;
  if (payload.end_date !== undefined) updateBody.end_date = payload.end_date;
  if (payload.start_time !== undefined)
    updateBody.start_time = payload.start_time || null;
  if (payload.end_time !== undefined)
    updateBody.end_time = payload.end_time || null;
  if (payload.notes !== undefined)
    updateBody.notes = payload.notes?.trim() || null;

  const { data, error } = await supabase
    .from("daily_goals")
    .update(updateBody)
    .eq("id", payload.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update goal");
  }

  return {
    success: true,
    statusCode: 200,
    message: "Goal updated",
    data: { goal: data as unknown as DailyGoal },
  };
};

// 4. Delete Goal
const deleteGoal = async (
  id: string
): Promise<ApiResponse<{ id: string }>> => {
  const userId = await getActiveUserId();

  const { error } = await supabase
    .from("daily_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to delete goal");
  }

  return {
    success: true,
    statusCode: 200,
    message: "Goal deleted",
    data: { id },
  };
};

const goalServices = {
  getGoalsByDate,
  createGoal,
  updateGoal,
  deleteGoal,
} as const;

export default goalServices;

