import { supabase, getActiveUserId } from "@/config/supabase";
import { LOG_SELECT } from "./timer.supabase";
import type { ApiResponse, TimeLog, DaySummary } from "@/types";

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
