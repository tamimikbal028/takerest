import { useState, useEffect } from "react";
import { Play, Square, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import trackerHooks from "@/hooks/useTracker";
import type { Category } from "@/types";

interface ContinuousTimerWidgetProps {
  categories: Category[];
}

export const ContinuousTimerWidget = ({
  categories,
}: ContinuousTimerWidgetProps) => {
  const { activeTimer, isLoading } = trackerHooks.useActiveTimer();
  const { mutate: startTimer, isPending: isStarting } =
    trackerHooks.useStartTimer();
  const { mutate: stopTimer, isPending: isStopping } =
    trackerHooks.useStopTimer();

  const isRunning = Boolean(activeTimer?.is_running);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Single unified selection: "act_catId_actId" or "others_catId"
  const [selectedKey, setSelectedKey] = useState<string>("");

  // Set default selection when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedKey) {
      // Find first category with an activity
      for (const cat of categories) {
        if (cat.activities && cat.activities.length > 0) {
          setSelectedKey(`act_${cat.id}_${cat.activities[0].id}`);
          return;
        }
      }
      // If categories exist but none have activities, fallback to first category
      setSelectedKey(`cat_${categories[0].id}`);
    }
  }, [categories, selectedKey]);

  // Real-time ticking clock when timer is running
  useEffect(() => {
    if (!isRunning || !activeTimer?.started_at) {
      setElapsedSeconds(0);
      return;
    }

    const calculateElapsed = () => {
      const startMs = new Date(activeTimer.started_at).getTime();
      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSecs);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [isRunning, activeTimer?.started_at]);

  // Format HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start tracking
  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();

    let targetCatId: string | undefined;
    let targetActId: string | null = null;
    let targetTitle = "Task";

    if (selectedKey.startsWith("act_")) {
      const [, catId, actId] = selectedKey.split("_");
      targetCatId = catId;
      targetActId = actId;
      const cat = categories.find((c) => c.id === catId);
      const act = cat?.activities?.find((a) => a.id === actId);
      targetTitle = act?.name || "Activity";
    } else if (
      selectedKey.startsWith("cat_") ||
      selectedKey.startsWith("others_")
    ) {
      const [, catId] = selectedKey.split("_");
      targetCatId = catId;
      targetActId = null;
      const cat = categories.find((c) => c.id === catId);
      targetTitle = cat?.name || "Task";
    }

    startTimer({
      category_id: targetCatId,
      activity_id: targetActId,
      title: targetTitle,
    });
  };

  // Stop running timer directly
  const handleStop = () => {
    stopTimer(
      { title: activeTimer?.title },
      {
        onSuccess: () => {
          setElapsedSeconds(0);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-44 w-full animate-pulse rounded-3xl bg-gray-200"></div>
    );
  }

  const activeCategory =
    activeTimer?.categories ||
    categories.find((c) => c.id === activeTimer?.category_id);
  const activeColor = activeCategory?.color || "#3B82F6";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
      {/* Background glow when active */}
      {isRunning && (
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full opacity-20 blur-3xl transition-all"
          style={{ backgroundColor: activeColor }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        {/* Left: Clock Display & Active Info */}
        <div className="flex flex-col items-center md:items-start">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: activeColor }}
                  />
                  <span
                    className="relative inline-flex h-3 w-3 rounded-full"
                    style={{ backgroundColor: activeColor }}
                  />
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider text-white uppercase shadow-2xs"
                  style={{ backgroundColor: activeColor }}
                >
                  {activeCategory?.name || "Active"}
                </span>
                <span className="text-xs font-bold text-gray-800">
                  • {activeTimer?.title}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-500">
                <Clock className="h-3 w-3 text-gray-400" />
                Timer Stopped
              </span>
            )}
          </div>

          {/* Running Digital Time */}
          <div className="mt-3 font-mono text-5xl font-black tracking-tight text-gray-900 sm:text-6xl">
            {formatTimer(elapsedSeconds)}
          </div>

          <p className="mt-1 text-xs font-medium text-gray-400">
            {isRunning && activeTimer?.started_at
              ? `Started at ${new Date(
                  activeTimer.started_at
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : "Select an activity and click Start"}
          </p>
        </div>

        {/* Right: Controls */}
        <div className="w-full md:w-auto">
          {isRunning ? (
            /* Timer is running: Show Stop Button */
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <button
                onClick={handleStop}
                disabled={isStopping}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95 disabled:opacity-50 sm:w-auto"
              >
                <Square className="h-4 w-4 fill-current" />
                {isStopping ? "Stopping..." : "Stop Timer"}
              </button>
            </div>
          ) : (
            /* Timer is stopped: Select Activity and Start */
            <form
              onSubmit={handleStart}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="w-full sm:w-64">
                <div className="flex items-center justify-between pb-1">
                  <label className="block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                    What are you doing?
                  </label>
                  <Link
                    to="/activities"
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Activity</span>
                  </Link>
                </div>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:border-blue-500 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <optgroup key={c.id} label={`Category: ${c.name}`}>
                      {(c.activities || []).map((a) => (
                        <option key={a.id} value={`act_${c.id}_${a.id}`}>
                          {a.name}
                        </option>
                      ))}
                      {(c.activities || []).length === 0 && (
                        <option value={`cat_${c.id}`}>
                          {c.name} (General)
                        </option>
                      )}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Start Button */}
              <button
                type="submit"
                disabled={isStarting || !selectedKey}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-current" />
                {isStarting ? "Starting..." : "Start Timer"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
