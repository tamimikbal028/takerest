import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import dayjs from "dayjs";
import {
  CATEGORY_SELECT,
  ACTIVITY_SELECT,
  TIME_LOG_SELECT,
  ACTIVE_TIMER_SELECT,
} from "../constants/tracker.js";

// Helper: Provision starter categories ('Study' with Course 1-5 and 'Others' with Rest, Meal, Break) ONLY on user registration
export const provisionNewUserStarterData = async (userId) => {
  // Check if user already has any category
  const { data: existing, error: searchError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (searchError || (existing && existing.length > 0)) {
    return;
  }

  // 1. Create permanent "Study" category (undeletable: is_system_default = true)
  const { data: studyCat } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: "Study",
      color: "#3B82F6",
      icon: "book-open",
      is_system_default: true,
      sort_order: 1,
    })
    .select(CATEGORY_SELECT)
    .single();

  if (studyCat) {
    // Insert 5 course activities under Study
    await supabase.from("activities").insert([
      {
        user_id: userId,
        category_id: studyCat.id,
        name: "Course 1",
        sort_order: 1,
      },
      {
        user_id: userId,
        category_id: studyCat.id,
        name: "Course 2",
        sort_order: 2,
      },
      {
        user_id: userId,
        category_id: studyCat.id,
        name: "Course 3",
        sort_order: 3,
      },
      {
        user_id: userId,
        category_id: studyCat.id,
        name: "Course 4",
        sort_order: 4,
      },
      {
        user_id: userId,
        category_id: studyCat.id,
        name: "Course 5",
        sort_order: 5,
      },
    ]);
  }

  // 2. Create standard "Others" category (deletable: is_system_default = false)
  const { data: othersCat } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: "Others",
      color: "#64748B",
      icon: "clock",
      is_system_default: false,
      sort_order: 2,
    })
    .select(CATEGORY_SELECT)
    .single();

  if (othersCat) {
    // Create 3 starter activities under Others
    await supabase.from("activities").insert([
      {
        user_id: userId,
        category_id: othersCat.id,
        name: "Rest",
        sort_order: 1,
      },
      {
        user_id: userId,
        category_id: othersCat.id,
        name: "Meal",
        sort_order: 2,
      },
      {
        user_id: userId,
        category_id: othersCat.id,
        name: "Break",
        sort_order: 3,
      },
    ]);
  }

  // 3. Initialize active timer (stopped by default)
  const timerCatId = othersCat?.id || studyCat?.id || null;
  const timerTitle = othersCat ? "Others" : "Study";
  await supabase.from("active_timer").upsert(
    {
      user_id: userId,
      category_id: timerCatId,
      title: timerTitle,
      started_at: new Date().toISOString(),
      is_running: false,
    },
    { onConflict: "user_id" }
  );
};

// ==========================================
// 1. CATEGORIES & ACTIVITIES
// ==========================================
const getCategoriesWithActivitiesService = async (userId) => {
  // Fetch all categories for user
  const { data: categoriesData, error: catError } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (catError) {
    throw new ApiError(500, "Failed to fetch categories.");
  }

  // Fetch all activities for user
  const { data: activitiesData, error: actError } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (actError) {
    throw new ApiError(500, "Failed to fetch activities.");
  }

  // Nest activities inside their parent category
  const categories = (categoriesData || []).map((cat) => {
    const matchedActivities = (activitiesData || []).filter(
      (act) => act.category_id === cat.id
    );
    return {
      ...cat,
      activities: matchedActivities,
    };
  });

  const meta = {
    totalCategories: categories.length,
    totalActivities: (activitiesData || []).length,
  };

  return { categories, meta };
};

const createCategoryService = async (
  userId,
  { name, color = "#3B82F6", icon = "folder" }
) => {
  if (!name || !name.trim()) {
    throw new ApiError(400, "Category name is required.");
  }

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: name.trim(),
      color: color || "#3B82F6",
      icon: icon || "folder",
      is_system_default: false,
    })
    .select(CATEGORY_SELECT)
    .single();

  if (error) {
    throw new ApiError(500, error.message || "Failed to create category.");
  }

  const meta = {
    action: "CREATE_CATEGORY",
  };

  return { category, meta };
};

const updateCategoryService = async (
  userId,
  categoryId,
  { name, color, icon }
) => {
  // Prevent editing protected Study category
  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("name, is_system_default")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();

  if (findError || !existing) {
    throw new ApiError(404, "Category not found.");
  }

  if (
    existing.is_system_default ||
    existing.name?.trim().toLowerCase() === "study"
  ) {
    throw new ApiError(400, "The Study category cannot be edited.");
  }

  const updateFields = {};
  if (name !== undefined) updateFields.name = name.trim();
  if (color !== undefined) updateFields.color = color;
  if (icon !== undefined) updateFields.icon = icon;

  const { data: category, error } = await supabase
    .from("categories")
    .update(updateFields)
    .eq("id", categoryId)
    .eq("user_id", userId)
    .select(CATEGORY_SELECT)
    .single();

  if (error || !category) {
    throw new ApiError(404, "Category not found or failed to update.");
  }

  const meta = {
    action: "UPDATE_CATEGORY",
  };

  return { category, meta };
};

const deleteCategoryService = async (userId, categoryId) => {
  // Prevent deleting protected categories (e.g. Study or is_system_default)
  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("name, is_system_default")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();

  if (findError || !existing) {
    throw new ApiError(404, "Category not found.");
  }

  if (
    existing.is_system_default ||
    existing.name?.trim().toLowerCase() === "study"
  ) {
    throw new ApiError(400, "The Study category cannot be deleted.");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (error) {
    throw new ApiError(500, "Failed to delete category.");
  }

  const meta = {
    deletedId: categoryId,
  };

  return { deletedId: categoryId, meta };
};

const createActivityService = async (
  userId,
  { category_id, name, color = null, icon = "activity", sort_order = 0 }
) => {
  if (!name || !name.trim()) {
    throw new ApiError(400, "Activity name is required.");
  }
  if (!category_id) {
    throw new ApiError(400, "category_id is required.");
  }

  const { data: activity, error } = await supabase
    .from("activities")
    .insert({
      user_id: userId,
      category_id,
      name: name.trim(),
      color: color || null,
      icon: icon || "activity",
      sort_order: sort_order || 0,
    })
    .select(ACTIVITY_SELECT)
    .single();

  if (error) {
    throw new ApiError(500, error.message || "Failed to create activity.");
  }

  const meta = {
    action: "CREATE_ACTIVITY",
  };

  return { activity, meta };
};

const updateActivityService = async (
  userId,
  activityId,
  { name, category_id, color, icon, sort_order }
) => {
  const updateFields = {};
  if (name !== undefined) updateFields.name = name.trim();
  if (category_id !== undefined) updateFields.category_id = category_id;
  if (color !== undefined) updateFields.color = color;
  if (icon !== undefined) updateFields.icon = icon;
  if (sort_order !== undefined) updateFields.sort_order = sort_order;

  const { data: activity, error } = await supabase
    .from("activities")
    .update(updateFields)
    .eq("id", activityId)
    .eq("user_id", userId)
    .select(ACTIVITY_SELECT)
    .single();

  if (error || !activity) {
    throw new ApiError(404, "Activity not found or failed to update.");
  }

  const meta = {
    action: "UPDATE_ACTIVITY",
  };

  return { activity, meta };
};

const deleteActivityService = async (userId, activityId) => {
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", userId);

  if (error) {
    throw new ApiError(500, "Failed to delete activity.");
  }

  const meta = {
    deletedId: activityId,
  };

  return { deletedId: activityId, meta };
};

// ==========================================
// 2. ACTIVE CONTINUOUS TIMER ENGINE
// ==========================================
const getActiveTimerService = async (userId) => {
  let { data: timer, error } = await supabase
    .from("active_timer")
    .select(ACTIVE_TIMER_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "Failed to fetch active timer state.");
  }

  // If no timer exists, initialize a default stopped timer
  if (!timer) {
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
        title: "Timer",
        started_at: new Date().toISOString(),
        is_running: false,
      })
      .select(ACTIVE_TIMER_SELECT)
      .single();

    if (createError) {
      throw new ApiError(500, "Failed to initialize active timer.");
    }
    timer = created;
  }

  const meta = {
    serverTime: new Date().toISOString(),
  };

  return { activeTimer: timer, meta };
};

// Save a chunk from the ongoing timer and reset timer to NOW
const saveChunkService = async (userId, chunkData) => {
  const { title, category_id, activity_id = null, notes = null } = chunkData;

  const { activeTimer } = await getActiveTimerService(userId);

  const now = new Date().toISOString();
  const startTime = new Date(activeTimer.started_at);
  const endTime = new Date(now);
  const durationSeconds = Math.max(
    0,
    Math.round((endTime.getTime() - startTime.getTime()) / 1000)
  );

  let savedLog = null;
  const targetCategoryId = category_id || activeTimer.category_id;
  const logTitle = title?.trim() || activeTimer.title || "Others";

  // Only create a log if at least a few seconds elapsed
  if (durationSeconds > 0 && targetCategoryId) {
    const { data: inserted, error: insertError } = await supabase
      .from("time_logs")
      .insert({
        user_id: userId,
        category_id: targetCategoryId,
        activity_id: activity_id || activeTimer.activity_id || null,
        title: logTitle,
        started_at: activeTimer.started_at,
        ended_at: now,
        duration_seconds: durationSeconds,
        is_wasted: false,
        notes: notes || null,
      })
      .select(TIME_LOG_SELECT)
      .single();

    if (insertError) {
      throw new ApiError(
        500,
        insertError.message || "Failed to record time chunk."
      );
    }
    savedLog = inserted;
  }

  // Reset active timer started_at to NOW
  const { data: updatedTimer, error: updateError } = await supabase
    .from("active_timer")
    .update({
      started_at: now,
      is_running: true,
    })
    .eq("user_id", userId)
    .select(ACTIVE_TIMER_SELECT)
    .single();

  if (updateError) {
    throw new ApiError(500, "Failed to advance active timer.");
  }

  const meta = {
    action: "SAVE_CHUNK",
    elapsedSeconds: durationSeconds,
  };

  return { savedLog, activeTimer: updatedTimer, meta };
};

// Seamless switch to another activity (e.g. starting Namaz or Course)
const switchTimerService = async (userId, switchData) => {
  const {
    category_id,
    activity_id = null,
    title,
    save_previous = true,
    previous_title,
    previous_notes = null,
  } = switchData;

  if (!category_id) {
    throw new ApiError(400, "category_id is required to switch timer.");
  }

  const { activeTimer } = await getActiveTimerService(userId);
  const now = new Date().toISOString();

  let savedLog = null;

  // Save the preceding interval if requested
  if (save_previous) {
    const startTime = new Date(activeTimer.started_at);
    const endTime = new Date(now);
    const durationSeconds = Math.max(
      0,
      Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    );

    if (durationSeconds > 0 && activeTimer.category_id) {
      const prevTitle = previous_title?.trim() || activeTimer.title || "Others";

      const { data: inserted, error: insertError } = await supabase
        .from("time_logs")
        .insert({
          user_id: userId,
          category_id: activeTimer.category_id,
          activity_id: activeTimer.activity_id || null,
          title: prevTitle,
          started_at: activeTimer.started_at,
          ended_at: now,
          duration_seconds: durationSeconds,
          is_wasted: false,
          notes: previous_notes || null,
        })
        .select(TIME_LOG_SELECT)
        .single();

      if (!insertError) {
        savedLog = inserted;
      }
    }
  }

  // Update active timer to the new target activity
  const nextTitle = title?.trim() || "Active Task";
  const { data: updatedTimer, error: updateError } = await supabase
    .from("active_timer")
    .update({
      category_id,
      activity_id: activity_id || null,
      title: nextTitle,
      started_at: now,
      is_running: true,
    })
    .eq("user_id", userId)
    .select(ACTIVE_TIMER_SELECT)
    .single();

  if (updateError) {
    throw new ApiError(500, "Failed to switch active timer.");
  }

  const meta = {
    action: "SWITCH_TIMER",
  };

  return { savedLog, activeTimer: updatedTimer, meta };
};

// Start a chosen activity/task
const startTimerService = async (
  userId,
  { category_id, activity_id = null, title }
) => {
  await getActiveTimerService(userId);
  const now = new Date().toISOString();

  let targetCatId = category_id;
  if (!targetCatId) {
    const { data: firstCat } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    targetCatId = firstCat?.id || null;
  }

  const taskTitle = title?.trim() || "Active Task";

  const { data: updatedTimer, error: updateError } = await supabase
    .from("active_timer")
    .update({
      category_id: targetCatId,
      activity_id: activity_id || null,
      title: taskTitle,
      started_at: now,
      is_running: true,
    })
    .eq("user_id", userId)
    .select(ACTIVE_TIMER_SELECT)
    .single();

  if (updateError) {
    throw new ApiError(500, "Failed to start timer.");
  }

  return { activeTimer: updatedTimer, meta: { action: "START_TIMER" } };
};

// Stop timer and record time log
const stopTimerService = async (
  userId,
  { notes = null, title = null } = {}
) => {
  const { activeTimer } = await getActiveTimerService(userId);
  const now = new Date().toISOString();

  let savedLog = null;
  let durationSeconds = 0;

  if (activeTimer.is_running && activeTimer.started_at) {
    const startTime = new Date(activeTimer.started_at);
    const endTime = new Date(now);
    durationSeconds = Math.max(
      0,
      Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    );

    if (durationSeconds > 0 && activeTimer.category_id) {
      const logTitle = title?.trim() || activeTimer.title || "Task";
      const { data: inserted, error: insertError } = await supabase
        .from("time_logs")
        .insert({
          user_id: userId,
          category_id: activeTimer.category_id,
          activity_id: activeTimer.activity_id || null,
          title: logTitle,
          started_at: activeTimer.started_at,
          ended_at: now,
          duration_seconds: durationSeconds,
          is_wasted: false,
          notes: notes || null,
        })
        .select(TIME_LOG_SELECT)
        .single();

      if (!insertError) {
        savedLog = inserted;
      }
    }
  }

  // Set is_running to false
  const { data: stoppedTimer, error: stopError } = await supabase
    .from("active_timer")
    .update({
      is_running: false,
    })
    .eq("user_id", userId)
    .select(ACTIVE_TIMER_SELECT)
    .single();

  if (stopError) {
    throw new ApiError(500, "Failed to stop timer.");
  }

  return {
    savedLog,
    activeTimer: stoppedTimer,
    meta: { action: "STOP_TIMER", durationSeconds },
  };
};

// ==========================================
// 3. LOGS & DAILY SUMMARY
// ==========================================
const getTodaySummaryService = async (userId, queryDate) => {
  const targetDate = queryDate || dayjs().format("YYYY-MM-DD");
  const startOfDay = dayjs(targetDate).startOf("day").toISOString();
  const endOfDay = dayjs(targetDate).endOf("day").toISOString();

  // Fetch all logs recorded for target date
  const { data: logs, error } = await supabase
    .from("time_logs")
    .select(TIME_LOG_SELECT)
    .eq("user_id", userId)
    .gte("started_at", startOfDay)
    .lte("started_at", endOfDay)
    .order("started_at", { ascending: true });

  if (error) {
    throw new ApiError(500, "Failed to fetch time logs for date.");
  }

  let totalTrackedSeconds = 0;
  const categoryMap = {};

  (logs || []).forEach((log) => {
    totalTrackedSeconds += log.duration_seconds || 0;

    const catId = log.category_id;
    const catName = log.categories?.name || "Others";
    const catColor = log.categories?.color || "#64748B";

    if (!categoryMap[catId]) {
      categoryMap[catId] = {
        id: catId,
        name: catName,
        color: catColor,
        durationSeconds: 0,
        logsCount: 0,
        activityMap: {},
      };
    }
    categoryMap[catId].durationSeconds += log.duration_seconds || 0;
    categoryMap[catId].logsCount += 1;

    // Track activity under this category
    const actId = log.activity_id || `title_${log.title || "general"}`;
    const actName = log.activities?.name || log.title || "General";
    const actColor = log.activities?.color || null;
    if (!categoryMap[catId].activityMap[actId]) {
      categoryMap[catId].activityMap[actId] = {
        id: actId,
        name: actName,
        color: actColor,
        durationSeconds: 0,
        logsCount: 0,
      };
    }
    categoryMap[catId].activityMap[actId].durationSeconds +=
      log.duration_seconds || 0;
    categoryMap[catId].activityMap[actId].logsCount += 1;
  });

  const categoryBreakdown = Object.values(categoryMap)
    .map((cat) => {
      const minutes = Math.round(cat.durationSeconds / 60);
      const hours = Number((cat.durationSeconds / 3600).toFixed(1));
      const percentage =
        totalTrackedSeconds > 0
          ? Math.round((cat.durationSeconds / totalTrackedSeconds) * 100)
          : 0;

      const activities = Object.values(cat.activityMap)
        .map((act) => {
          const actMinutes = Math.round(act.durationSeconds / 60);
          const actHours = Number((act.durationSeconds / 3600).toFixed(1));
          const actCategoryPercentage =
            cat.durationSeconds > 0
              ? Math.round((act.durationSeconds / cat.durationSeconds) * 100)
              : 0;
          const actDayPercentage =
            totalTrackedSeconds > 0
              ? Math.round((act.durationSeconds / totalTrackedSeconds) * 100)
              : 0;

          return {
            id: act.id,
            name: act.name,
            color: act.color,
            durationSeconds: act.durationSeconds,
            logsCount: act.logsCount,
            minutes: actMinutes,
            hours: actHours,
            percentage: actCategoryPercentage,
            categoryPercentage: actCategoryPercentage,
            dayPercentage: actDayPercentage,
          };
        })
        .sort((a, b) => b.durationSeconds - a.durationSeconds);

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        durationSeconds: cat.durationSeconds,
        logsCount: cat.logsCount,
        minutes,
        hours,
        percentage,
        activities,
      };
    })
    .sort((a, b) => b.durationSeconds - a.durationSeconds);

  const totalTrackedMinutes = Math.round(totalTrackedSeconds / 60);
  const totalTrackedHours = Number((totalTrackedSeconds / 3600).toFixed(1));

  const summary = {
    date: targetDate,
    totalTrackedSeconds,
    totalTrackedMinutes,
    totalTrackedHours,
    totalLogsCount: (logs || []).length,
    categoryBreakdown,
  };

  const meta = {
    logsCount: (logs || []).length,
  };

  return { logs: logs || [], summary, meta };
};

const deleteTimeLogService = async (userId, logId) => {
  const { error } = await supabase
    .from("time_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", userId);

  if (error) {
    throw new ApiError(500, "Failed to delete time log.");
  }

  const meta = {
    deletedId: logId,
  };

  return { deletedId: logId, meta };
};

// ==========================================
// EXPORT IN PLURAL FORM
// ==========================================
const trackerServices = {
  provisionNewUserStarterData,
  getCategoriesWithActivitiesService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  createActivityService,
  updateActivityService,
  deleteActivityService,
  getActiveTimerService,
  startTimerService,
  stopTimerService,
  saveChunkService,
  switchTimerService,
  getTodaySummaryService,
  deleteTimeLogService,
};

export default trackerServices;
