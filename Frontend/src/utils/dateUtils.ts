import dayjs from "dayjs";

/**
 * Formats a date string to the format: "11-jan-2025 2:56 AM"
 * @param dateString - ISO date string or any valid date format
 * @returns Formatted date string
 */
export const formatPostTime = (dateString: string): string => {
  return dayjs(dateString).format("DD-MMM-YYYY h:mm A");
};

export const formatPostDate = (dateString: string): string => {
  return dayjs(dateString).format("DD-MMM-YYYY");
};

export const formatPostClock = (dateString: string): string => {
  return dayjs(dateString).format("h:mm A");
};

/**
 * Formats a date string with date and time separated by a dot
 * @param dateString - ISO date string or any valid date format
 * @returns Formatted string: "07-Nov-2025 • 2:56 PM"
 */
export const formatPostDateTime = (dateString: string): string => {
  const date = dayjs(dateString).format("DD-MMM-YYYY");
  const time = dayjs(dateString).format("h:mm A");
  return `${date} • ${time}`;
};

/**
 * Formats a date string for relative time (e.g., "5m ago", "2h ago", "Yesterday", "3d ago")
 * Falls back to formatted date if older than 7 days
 * @param dateString - ISO date string or any valid date format
 * @returns Formatted time string
 */
export const formatRelativeTime = (dateString: string): string => {
  const now = dayjs();
  const postTime = dayjs(dateString);
  const diffInMinutes = now.diff(postTime, "minute");
  const diffInHours = now.diff(postTime, "hour");
  const diffInDays = now.diff(postTime, "day");

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  // For older posts, use the formatted date
  return formatPostDate(dateString);
};

export interface SplitLogChunk {
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

/**
 * Splits a time range that spans across midnight (12:00 AM local time) into
 * clean chunks separated by each day's local midnight.
 */
export const splitIntervalByMidnight = (
  startIso: string,
  endIso: string
): SplitLogChunk[] => {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (
    isNaN(start.getTime()) ||
    isNaN(end.getTime()) ||
    end.getTime() <= start.getTime()
  ) {
    const validStart = isNaN(start.getTime())
      ? new Date().toISOString()
      : startIso;
    const validEnd = isNaN(end.getTime()) ? validStart : endIso;
    return [
      {
        started_at: validStart,
        ended_at: validEnd,
        duration_seconds: 1,
      },
    ];
  }

  const chunks: SplitLogChunk[] = [];
  let currentStart = new Date(start);

  while (currentStart.getTime() < end.getTime()) {
    // Next local midnight: 00:00:00.000 of the following day
    const nextMidnight = new Date(
      currentStart.getFullYear(),
      currentStart.getMonth(),
      currentStart.getDate() + 1,
      0,
      0,
      0,
      0
    );

    if (nextMidnight.getTime() <= end.getTime()) {
      const durationSeconds = Math.max(
        1,
        Math.round((nextMidnight.getTime() - currentStart.getTime()) / 1000)
      );

      chunks.push({
        started_at: currentStart.toISOString(),
        ended_at: nextMidnight.toISOString(),
        duration_seconds: durationSeconds,
      });

      currentStart = nextMidnight;
    } else {
      const durationSeconds = Math.max(
        1,
        Math.round((end.getTime() - currentStart.getTime()) / 1000)
      );

      chunks.push({
        started_at: currentStart.toISOString(),
        ended_at: end.toISOString(),
        duration_seconds: durationSeconds,
      });

      break;
    }

    // Safety guard to avoid unexpected runaway loops
    if (chunks.length > 60) break;
  }

  return chunks;
};
