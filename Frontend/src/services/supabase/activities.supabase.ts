import { supabase, getActiveUserId } from "@/config/supabase";
import type { ApiResponse, Activity } from "@/types";

export const supabaseCreateActivity = async (
  activityData: Partial<Activity>
): Promise<ApiResponse<{ activity: Activity }>> => {
  const userId = await getActiveUserId();

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: userId,
      category_id: activityData.category_id,
      name: activityData.name,
      color: activityData.color || null,
      icon: activityData.icon || "activity",
      sort_order: activityData.sort_order ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create activity");
  }

  return {
    statusCode: 201,
    success: true,
    message: "Activity created successfully",
    data: { activity: data },
  };
};

export const supabaseUpdateActivity = async (
  id: string,
  activityData: Partial<Activity>
): Promise<ApiResponse<{ activity: Activity }>> => {
  const userId = await getActiveUserId();

  const updatePayload: Partial<Activity> = {};
  if (activityData.name !== undefined) updatePayload.name = activityData.name;
  if (activityData.color !== undefined) updatePayload.color = activityData.color;
  if (activityData.icon !== undefined) updatePayload.icon = activityData.icon;
  if (activityData.sort_order !== undefined)
    updatePayload.sort_order = activityData.sort_order;
  if (activityData.category_id !== undefined)
    updatePayload.category_id = activityData.category_id;

  const { data, error } = await supabase
    .from("activities")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update activity");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Activity updated successfully",
    data: { activity: data },
  };
};

export const supabaseDeleteActivity = async (
  id: string
): Promise<ApiResponse<{ deletedId: string }>> => {
  const userId = await getActiveUserId();

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to delete activity");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Activity deleted successfully",
    data: { deletedId: id },
  };
};
