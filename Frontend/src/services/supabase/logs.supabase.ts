import { supabase, getActiveUserId } from "@/config/supabase";
import { LOG_SELECT } from "./timer.supabase";
import { splitIntervalByMidnight } from "@/utils/dateUtils";
import type {
  ApiResponse,
  TimeLog,
  DaySummary,
  MonthStudySummary,
  MonthStudyDay,
} from "@/types";

export const supabaseGetTodaySummary = async (
  date?: string
): Promise<ApiResponse<{ logs: TimeLog[]; summary: DaySummary }>> => {
  const userId = await getActiveUserId();

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const targetDate = date || getLocalDateString();
  const startOfDay = new Date(`${targetDate}T00:00:00`).toISOString();
  const endOfDay = new Date(`${targetDate}T23:59:59.999`).toISOString();

  const { data: logsData, error } = await supabase
    .from("time_logs")
    .select(LOG_SELECT)
    .eq("user_id", userId)
    .gte("started_at", startOfDay)
    .lte("started_at", endOfDay)
    .order("started_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch time logs");
  }

  const logs = (logsData || []) as unknown as TimeLog[];

  // Compute aggregated day summary
  let totalTrackedSeconds = 0;
  const categoryMap: Record<
    string,
    {
      id: string;
      name: string;
      color: string;
      durationSeconds: number;
      logsCount: number;
      activityMap: Record<
        string,
        {
          id: string;
          name: string;
          color: string | null;
          durationSeconds: number;
          logsCount: number;
        }
      >;
    }
  > = {};

  logs.forEach((log) => {
    const dur = log.duration_seconds || 0;
    totalTrackedSeconds += dur;

    const catId = log.category_id || "uncategorized";
    const catName = log.categories?.name || "Others";
    const catColor = log.categories?.color || "#3B82F6";

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

    categoryMap[catId].durationSeconds += dur;
    categoryMap[catId].logsCount += 1;

    const actId = log.activity_id || "no_activity";
    const actName = log.activities?.name || log.title || "General";
    const actColor = log.activities?.color || catColor;

    if (!categoryMap[catId].activityMap[actId]) {
      categoryMap[catId].activityMap[actId] = {
        id: actId,
        name: actName,
        color: actColor,
        durationSeconds: 0,
        logsCount: 0,
      };
    }

    categoryMap[catId].activityMap[actId].durationSeconds += dur;
    categoryMap[catId].activityMap[actId].logsCount += 1;
  });

  const categoryBreakdown = Object.values(categoryMap)
    .map((cat) => {
      const catMinutes = Math.round(cat.durationSeconds / 60);
      const catHours = Number((cat.durationSeconds / 3600).toFixed(1));
      const catPercentage =
        totalTrackedSeconds > 0
          ? Math.round((cat.durationSeconds / totalTrackedSeconds) * 100)
          : 0;

      const activities = Object.values(cat.activityMap)
        .map((act) => {
          const actMinutes = Math.round(act.durationSeconds / 60);
          const actHours = Number((act.durationSeconds / 3600).toFixed(1));
          const actCatPercentage =
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
            percentage: actCatPercentage,
            categoryPercentage: actCatPercentage,
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
        minutes: catMinutes,
        hours: catHours,
        percentage: catPercentage,
        activities,
      };
    })
    .sort((a, b) => b.durationSeconds - a.durationSeconds);

  const summary: DaySummary = {
    date: targetDate,
    totalTrackedSeconds,
    totalTrackedMinutes: Math.round(totalTrackedSeconds / 60),
    totalTrackedHours: Number((totalTrackedSeconds / 3600).toFixed(1)),
    totalLogsCount: logs.length,
    categoryBreakdown,
  };

  return {
    statusCode: 200,
    success: true,
    message: "Day summary and logs fetched successfully",
    data: { logs, summary },
  };
};

export const supabaseDeleteTimeLog = async (
  id: string
): Promise<ApiResponse<{ deletedId: string }>> => {
  const userId = await getActiveUserId();

  const { error } = await supabase
    .from("time_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to delete time log");
  }

  return {
    statusCode: 200,
    success: true,
    message: "Time log deleted successfully",
    data: { deletedId: id },
  };
};

export interface CreateTimeLogPayload {
  category_id: string;
  activity_id?: string | null;
  title: string;
  started_at: string;
  ended_at: string;
  notes?: string | null;
  is_wasted?: boolean;
}

export const supabaseCreateTimeLog = async (
  payload: CreateTimeLogPayload
): Promise<ApiResponse<{ log: TimeLog }>> => {
  const userId = await getActiveUserId();
  const chunks = splitIntervalByMidnight(payload.started_at, payload.ended_at);

  const logRows = chunks.map((chunk) => ({
    user_id: userId,
    category_id: payload.category_id,
    activity_id: payload.activity_id || null,
    title: payload.title.trim() || "Manual Log",
    started_at: chunk.started_at,
    ended_at: chunk.ended_at,
    duration_seconds: chunk.duration_seconds,
    is_wasted: payload.is_wasted ?? false,
    notes: payload.notes?.trim() || null,
  }));

  const { data: inserted, error } = await supabase
    .from("time_logs")
    .insert(logRows)
    .select(LOG_SELECT);

  if (error) {
    throw new Error(error.message || "Failed to create time log");
  }

  const savedLog = (inserted?.[0] || null) as unknown as TimeLog;

  return {
    statusCode: 201,
    success: true,
    message: "Time log created successfully",
    data: { log: savedLog },
  };
};

export const supabaseGetMonthStudySummary = async (
  year: number,
  month: number
): Promise<ApiResponse<MonthStudySummary>> => {
  const userId = await getActiveUserId();

  // 1. Fetch study category ID(s)
  const { data: categoriesData, error: catError } = await supabase
    .from("categories")
    .select("id, name, is_system_default")
    .eq("user_id", userId);

  if (catError) {
    throw new Error(catError.message || "Failed to fetch categories");
  }

  const studyCategoryIds = new Set<string>();
  (categoriesData || []).forEach((cat) => {
    if (
      cat.is_system_default ||
      cat.name?.trim().toLowerCase() === "study"
    ) {
      studyCategoryIds.add(cat.id);
    }
  });

  // 2. Query range with 1 day padding on each end to handle timezone shifts
  const startDate = new Date(year, month - 1, 1 - 1, 0, 0, 0, 0).toISOString();
  const endDate = new Date(year, month, 1, 23, 59, 59, 999).toISOString();

  const { data: logsData, error } = await supabase
    .from("time_logs")
    .select(LOG_SELECT)
    .eq("user_id", userId)
    .gte("started_at", startDate)
    .lte("started_at", endDate)
    .order("started_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to fetch month time logs");
  }

  const logs = (logsData || []) as unknown as TimeLog[];

  const getLocalDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const daysMap: Record<string, MonthStudyDay> = {};

  // Initialize all days in the month
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
    daysMap[dateStr] = {
      date: dateStr,
      studySeconds: 0,
      studyLogsCount: 0,
    };
  }

  let totalStudySeconds = 0;
  let totalStudyLogsCount = 0;

  logs.forEach((log) => {
    // Only count logs that belong to the Study category!
    const isStudy =
      (log.categories?.name &&
        log.categories.name.trim().toLowerCase() === "study") ||
      studyCategoryIds.has(log.category_id);

    if (!isStudy) return;

    const logDate = getLocalDateString(new Date(log.started_at));
    if (daysMap[logDate]) {
      const dur = log.duration_seconds || 0;
      daysMap[logDate].studySeconds += dur;
      daysMap[logDate].studyLogsCount += 1;
      totalStudySeconds += dur;
      totalStudyLogsCount += 1;
    }
  });

  let activeStudyDaysCount = 0;
  let peakDay: { date: string; studySeconds: number } | null = null;

  Object.values(daysMap).forEach((dayData) => {
    if (dayData.studySeconds > 0) {
      activeStudyDaysCount += 1;
      if (!peakDay || dayData.studySeconds > peakDay.studySeconds) {
        peakDay = {
          date: dayData.date,
          studySeconds: dayData.studySeconds,
        };
      }
    }
  });

  return {
    statusCode: 200,
    success: true,
    message: "Month study summary fetched successfully",
    data: {
      year,
      month,
      totalStudySeconds,
      totalStudyLogsCount,
      activeStudyDaysCount,
      days: daysMap,
      peakDay,
    },
  };
};
