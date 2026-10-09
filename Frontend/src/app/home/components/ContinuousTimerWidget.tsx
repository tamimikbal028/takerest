import { useState, useEffect, useRef, useMemo } from "react";
import { Play, Square, Clock, ChevronDown, Check } from "lucide-react";
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

  // Single unified selection: "act_catId_actId" or "cat_catId"
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Compute selected item details for preview
  const selectedInfo = useMemo(() => {
    if (!selectedKey) return null;
    if (selectedKey.startsWith("act_")) {
      const [, catId, actId] = selectedKey.split("_");
      const cat = categories.find((c) => c.id === catId);
      const act = cat?.activities?.find((a) => a.id === actId);
      if (act && cat) {
        return {
          title: act.name,
          categoryName: cat.name,
          color: cat.color || "#3B82F6",
        };
      }
    } else if (
      selectedKey.startsWith("cat_") ||
      selectedKey.startsWith("others_")
    ) {
      const [, catId] = selectedKey.split("_");
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        return {
          title: `${cat.name} (General)`,
          categoryName: cat.name,
          color: cat.color || "#3B82F6",
        };
      }
    }
    return null;
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
    <div className="relative rounded-3xl border border-gray-200 bg-white p-5 shadow-xs sm:p-7">
      {/* Background glow when active - contained inside its own overflow-hidden layer */}
      {isRunning && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div
            className="absolute -top-10 -right-10 h-44 w-44 rounded-full opacity-20 blur-3xl transition-all"
            style={{ backgroundColor: activeColor }}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-between gap-5 sm:flex-row">
        {/* Left: Clock Display & Active Info */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: activeColor }}
                  />
                  <span
                    className="relative inline-flex h-2.5 w-2.5 rounded-full"
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
          <div className="mt-2 font-mono text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
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
        <div className="w-full sm:w-auto">
          {isRunning ? (
            /* Timer is running: Show Stop Button */
            <div className="flex w-full justify-center sm:justify-end">
              <button
                onClick={handleStop}
                disabled={isStopping}
                className="inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 text-sm font-bold text-white shadow-md shadow-red-500/20 transition hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 active:scale-95 disabled:opacity-50 sm:w-auto"
              >
                <Square className="h-3.5 w-3.5 shrink-0 fill-current" />
                <span className="whitespace-nowrap">
                  {isStopping ? "Stopping..." : "Stop Timer"}
                </span>
              </button>
            </div>
          ) : (
            /* Timer is stopped: Select Activity and Start */
            <form
              onSubmit={handleStart}
              className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-end"
            >
              <div
                ref={dropdownRef}
                className="relative w-full sm:w-56 md:w-60"
              >
                <label className="block pb-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  What are you doing?
                </label>

                {/* Custom Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-white px-3.5 text-left transition-all ${
                    isDropdownOpen
                      ? "border-blue-500 shadow-xs ring-3 ring-blue-500/15"
                      : "border-gray-200 shadow-2xs hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full shadow-2xs"
                      style={{
                        backgroundColor: selectedInfo?.color || "#3B82F6",
                      }}
                    />
                    <span className="truncate text-xs font-bold text-gray-800 sm:text-sm">
                      {selectedInfo?.title || "Choose activity"}
                    </span>
                    {selectedInfo?.categoryName && (
                      <span className="ml-auto shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                        {selectedInfo.categoryName}
                      </span>
                    )}
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                {/* Custom Dropdown Menu - opens cleanly without parent clipping */}
                {isDropdownOpen && (
                  <div className="hide-scrollbar absolute top-full left-0 z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl ring-1 ring-black/5">
                    {categories.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">
                        No activities available
                      </div>
                    ) : (
                      categories.map((c) => {
                        const activities = c.activities || [];
                        return (
                          <div key={c.id} className="py-1 first:pt-0 last:pb-0">
                            {/* Category Group Header */}
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              <span className="truncate">{c.name}</span>
                            </div>

                            {/* Activities */}
                            <div className="mt-0.5 space-y-0.5">
                              {activities.map((act) => {
                                const key = `act_${c.id}_${act.id}`;
                                const isSelected = selectedKey === key;
                                return (
                                  <button
                                    key={act.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedKey(key);
                                      setIsDropdownOpen(false);
                                    }}
                                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                                      isSelected
                                        ? "bg-blue-50 font-bold text-blue-700"
                                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                  >
                                    <span className="truncate">{act.name}</span>
                                    {isSelected && (
                                      <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                    )}
                                  </button>
                                );
                              })}

                              {activities.length === 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedKey(`cat_${c.id}`);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold italic transition ${
                                    selectedKey === `cat_${c.id}`
                                      ? "bg-blue-50 font-bold text-blue-700"
                                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                  }`}
                                >
                                  <span className="truncate">
                                    {c.name} (General)
                                  </span>
                                  {selectedKey === `cat_${c.id}` && (
                                    <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Start Button */}
              <button
                type="submit"
                disabled={isStarting || !selectedKey}
                className="inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Play className="h-3.5 w-3.5 shrink-0 fill-current" />
                <span className="whitespace-nowrap">
                  {isStarting ? "Starting..." : "Start Timer"}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
