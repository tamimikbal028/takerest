import { supabase, getActiveUserId } from "@/config/supabase";
import type { ApiResponse, ActiveTimer, TimeLog } from "@/types";

export const TIMER_SELECT =
  "user_id, category_id, activity_id, title, started_at, is_running, updated_at, categories(id, name, color, icon), activities(id, name, color, icon)";

export const LOG_SELECT =
  "id, user_id, category_id, activity_id, title, started_at, ended_at, duration_seconds, is_wasted, notes, created_at, categories(id, name, color, icon), activities(id, name, color, icon)";

export const supabaseGetActiveTimer = async (): Promise<
  ApiResponse<{ activeTimer: ActiveTimer }>
> => {
  const userId = await getActiveUserId();

  const { data, error } = await supabase
    .from("active_timer")
    .select(TIMER_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to fetch active timer");
  }

  // If no timer record exists, initialize a default stopped timer
  if (!data) {
    const { data: firstCat } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const { data: created, error: createError } = await supabase
      .from("active_timer")
      .insert({
        user_id: userId,
        category_id: firstCat?.id || null,
        activity_id: null,
        title: "Task",
        started_at: new Date().toISOString(),
        is_running: false,
      })
      .select(TIMER_SELECT)
      .single();

    if (createError) {
      throw new Error(createError.message || "Failed to initialize active timer");
    }

    return {
      statusCode: 200,
      success: true,
      message: "Active timer initialized",
      data: { activeTimer: created as unknown as ActiveTimer },
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Active timer fetched successfully",
    data: { activeTimer: data as unknown as ActiveTimer },
  };
};

export interface StartTimerPayload {
  category_id?: string;
  activity_id?: string | null;
  title?: string;
}

export const supabaseStartTimer = async (
  payload: StartTimerPayload
): Promise<ApiResponse<{ activeTimer: ActiveTimer }>> => {
  const userId = await getActiveUserId();
  const now = new Date().toISOString();
  const taskTitle = payload.title?.trim() || "Active Task";

  let targetCatId = payload.category_id;
  if (!targetCatId) {
    const { data: firstCat } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    targetCatId = firstCat?.id || null;
  }

  const { data, error } = await supabase
    .from("active_timer")
    .upsert({
      user_id: userId,
      category_id: targetCatId,
      activity_id: payload.activity_id || null,
      title: taskTitle,
      started_at: now,
      is_running: true,
    })
    .select(TIMER_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to start timer");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Timer started successfully",
    data: { activeTimer: data as unknown as ActiveTimer },
  };
};

export interface StopTimerPayload {
  notes?: string | null;
  title?: string;
}

export const supabaseStopTimer = async (
  payload?: StopTimerPayload
): Promise<
  ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>
> => {
  const userId = await getActiveUserId();
  const now = new Date().toISOString();

  const { data: currentTimer } = await supabase
    .from("active_timer")
    .select("*")
    .eq("user_id", userId)
    .single();

  let savedLog: TimeLog | null = null;

  if (
    currentTimer?.is_running &&
    currentTimer.started_at &&
    currentTimer.category_id
  ) {
    const startMs = new Date(currentTimer.started_at).getTime();
    const endMs = new Date(now).getTime();
    const durationSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));
    const logTitle = payload?.title?.trim() || currentTimer.title || "Task";

    const { data: inserted, error: insertError } = await supabase
      .from("time_logs")
      .insert({
        user_id: userId,
        category_id: currentTimer.category_id,
        activity_id: currentTimer.activity_id || null,
        title: logTitle,
        started_at: currentTimer.started_at,
        ended_at: now,
        duration_seconds: durationSeconds,
        is_wasted: false,
        notes: payload?.notes || null,
      })
      .select(LOG_SELECT)
      .single();

    if (!insertError && inserted) {
      savedLog = inserted as unknown as TimeLog;
    }
  }

  const { data: stoppedTimer, error: stopError } = await supabase
    .from("active_timer")
    .update({
      is_running: false,
    })
    .eq("user_id", userId)
    .select(TIMER_SELECT)
    .single();

  if (stopError) {
    throw new Error(stopError.message || "Failed to stop timer");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Timer stopped and log saved",
    data: {
      savedLog,
      activeTimer: stoppedTimer as unknown as ActiveTimer,
    },
  };
};

export interface SaveChunkPayload {
  title?: string;
  category_id?: string;
  activity_id?: string | null;
  notes?: string | null;
}

export const supabaseSaveChunk = async (
  payload: SaveChunkPayload
): Promise<
  ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>
> => {
  const userId = await getActiveUserId();
  const now = new Date().toISOString();

  const { data: currentTimer } = await supabase
    .from("active_timer")
    .select("*")
    .eq("user_id", userId)
    .single();

  let savedLog: TimeLog | null = null;

  if (currentTimer?.started_at && currentTimer.category_id) {
    const startMs = new Date(currentTimer.started_at).getTime();
    const endMs = new Date(now).getTime();
    const durationSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));

    const { data: inserted } = await supabase
      .from("time_logs")
      .insert({
        user_id: userId,
        category_id: payload.category_id || currentTimer.category_id,
        activity_id: payload.activity_id ?? currentTimer.activity_id,
        title: payload.title?.trim() || currentTimer.title || "Task",
        started_at: currentTimer.started_at,
        ended_at: now,
        duration_seconds: durationSeconds,
        is_wasted: false,
        notes: payload.notes || null,
      })
      .select(LOG_SELECT)
      .single();

    if (inserted) {
      savedLog = inserted as unknown as TimeLog;
    }
  }

  const { data: updatedTimer, error: updateError } = await supabase
    .from("active_timer")
    .update({
      started_at: now,
      is_running: true,
    })
    .eq("user_id", userId)
    .select(TIMER_SELECT)
    .single();

  if (updateError) {
    throw new Error(updateError.message || "Failed to advance timer");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Time chunk saved",
    data: {
      savedLog,
      activeTimer: updatedTimer as unknown as ActiveTimer,
    },
  };
};

export interface SwitchTimerPayload {
  category_id: string;
  activity_id?: string | null;
  title?: string;
  save_previous?: boolean;
  previous_title?: string;
  previous_notes?: string | null;
}

export const supabaseSwitchTimer = async (
  payload: SwitchTimerPayload
): Promise<
  ApiResponse<{ savedLog: TimeLog | null; activeTimer: ActiveTimer }>
> => {
  const userId = await getActiveUserId();
  const now = new Date().toISOString();

  const { data: currentTimer } = await supabase
    .from("active_timer")
    .select("*")
    .eq("user_id", userId)
    .single();

  let savedLog: TimeLog | null = null;

  if (
    (payload.save_previous ?? true) &&
    currentTimer?.is_running &&
    currentTimer.started_at &&
    currentTimer.category_id
  ) {
    const startMs = new Date(currentTimer.started_at).getTime();
    const endMs = new Date(now).getTime();
    const durationSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));

    const { data: inserted } = await supabase
      .from("time_logs")
      .insert({
        user_id: userId,
        category_id: currentTimer.category_id,
        activity_id: currentTimer.activity_id || null,
        title: payload.previous_title?.trim() || currentTimer.title || "Task",
        started_at: currentTimer.started_at,
        ended_at: now,
        duration_seconds: durationSeconds,
        is_wasted: false,
        notes: payload.previous_notes || null,
      })
      .select(LOG_SELECT)
      .single();

    if (inserted) {
      savedLog = inserted as unknown as TimeLog;
    }
  }

  const nextTitle = payload.title?.trim() || "Active Task";
  const { data: updatedTimer, error: updateError } = await supabase
    .from("active_timer")
    .update({
      category_id: payload.category_id,
      activity_id: payload.activity_id || null,
      title: nextTitle,
      started_at: now,
      is_running: true,
    })
    .eq("user_id", userId)
    .select(TIMER_SELECT)
    .single();

  if (updateError) {
    throw new Error(updateError.message || "Failed to switch timer");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Timer switched successfully",
    data: {
      savedLog,
      activeTimer: updatedTimer as unknown as ActiveTimer,
    },
  };
};
