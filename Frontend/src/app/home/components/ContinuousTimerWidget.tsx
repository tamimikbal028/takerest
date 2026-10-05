import { useState, useEffect } from "react";
import { Check, RotateCw, AlertTriangle } from "lucide-react";
import trackerHooks from "@/hooks/useTracker";
import type { Category } from "@/types";

interface ContinuousTimerWidgetProps {
  categories: Category[];
  onOpenSwitchModal: () => void;
}

const QUICK_CHIPS = [
  { label: "বিশ্রাম (Rest)", wasted: false },
  { label: "গোসল (Bath)", wasted: false },
  { label: "খাবার (Meal)", wasted: false },
  { label: "আড্ডা (Adda)", wasted: true },
  { label: "গেম খেলা (Gaming)", wasted: true },
  { label: "সোশ্যাল মিডিয়া (Social)", wasted: true },
];

export const ContinuousTimerWidget = ({
  categories,
  onOpenSwitchModal,
}: ContinuousTimerWidgetProps) => {
  const { activeTimer, isLoading } = trackerHooks.useActiveTimer();
  const { mutate: saveChunk, isPending: isSaving } =
    trackerHooks.useSaveChunk();

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isChunkModalOpen, setIsChunkModalOpen] = useState<boolean>(false);

  // Form states
  const [chunkTitle, setChunkTitle] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isWasted, setIsWasted] = useState<boolean>(false);
  const [chunkNotes, setChunkNotes] = useState<string>("");

  // Real-time ticking clock
  useEffect(() => {
    if (!activeTimer?.started_at) return;

    const calculateElapsed = () => {
      const startMs = new Date(activeTimer.started_at).getTime();
      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSecs);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.started_at]);

  // Open Save Chunk Modal
  const handleOpenChunkModal = () => {
    setChunkTitle(
      activeTimer?.title === "Others" ? "" : activeTimer?.title || ""
    );
    setSelectedCategoryId(activeTimer?.category_id || categories[0]?.id || "");
    setIsWasted(false);
    setChunkNotes("");
    setIsChunkModalOpen(true);
  };

  const handleSaveChunkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = chunkTitle.trim() || activeTimer?.title || "Others";

    saveChunk(
      {
        title: finalTitle,
        category_id:
          selectedCategoryId || activeTimer?.category_id || undefined,
        activity_id: activeTimer?.activity_id || null,
        is_wasted: isWasted,
        notes: chunkNotes.trim() || null,
      },
      {
        onSuccess: () => {
          setIsChunkModalOpen(false);
        },
      }
    );
  };

  // Format HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="h-44 w-full animate-pulse rounded-3xl bg-gray-200"></div>
    );
  }

  const categoryName = activeTimer?.categories?.name || "Others";
  const categoryColor = activeTimer?.categories?.color || "#64748B";
  const isOthers = categoryName.toLowerCase() === "others";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-md sm:p-8">
      {/* Top subtle glow with active category color */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: categoryColor }}
      />

      <div className="relative z-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
        {/* Left: Active Status & Digital Clock */}
        <div className="flex flex-col items-center sm:items-start">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: categoryColor }}
              />
              <span
                className="relative inline-flex h-3 w-3 rounded-full"
                style={{ backgroundColor: categoryColor }}
              />
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider text-white uppercase shadow-xs"
              style={{ backgroundColor: categoryColor }}
            >
              {categoryName}
            </span>
            <span className="text-xs font-semibold text-gray-600">
              {isOthers ? "• Gap / Unassigned Time" : `• ${activeTimer?.title}`}
            </span>
          </div>

          {/* Running Clock */}
          <div className="mt-3 font-mono text-5xl font-black tracking-tight text-gray-900 sm:text-6xl">
            {formatTimer(elapsedSeconds)}
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Started at{" "}
            {activeTimer?.started_at
              ? new Date(activeTimer.started_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "just now"}
          </p>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Save Log Chunk Button */}
          <button
            onClick={handleOpenChunkModal}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95"
          >
            <Check className="h-4 w-4" />
            Save Log Chunk
          </button>

          {/* Switch Activity Button */}
          <button
            onClick={onOpenSwitchModal}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-800 shadow-xs transition hover:bg-gray-100 active:scale-95"
          >
            <RotateCw className="h-4 w-4 text-gray-600" />
            Switch Activity
          </button>
        </div>
      </div>

      {/* Save Chunk Modal */}
      {isChunkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Save Time Chunk</h3>
            <p className="mt-1 text-xs text-gray-600">
              Elapsed:{" "}
              <span className="font-bold text-blue-600">
                {formatTimer(elapsedSeconds)}
              </span>
              . Record this segment and the continuous clock will advance to
              now.
            </p>

            {/* Quick Suggestion Chips */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700">
                Quick Selection
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setChunkTitle(chip.label);
                      setIsWasted(chip.wasted);
                    }}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      chunkTitle === chip.label
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveChunkSubmit} className="mt-4 space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-800">
                  Activity Title / Description
                </label>
                <input
                  type="text"
                  required
                  value={chunkTitle}
                  onChange={(e) => setChunkTitle(e.target.value)}
                  placeholder="e.g. গোসল, দুপুরের খাবার, রেস্ট"
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Group / Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-800">
                  Assign to Group
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mark as Wasted Time Checkbox */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <label className="flex cursor-pointer items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-amber-950">
                        Mark as Wasted Time
                      </span>
                      <p className="text-[11px] text-amber-800">
                        Check if this time was lost to procrastination, gaming,
                        or aimless delay
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isWasted}
                    onChange={(e) => setIsWasted(e.target.checked)}
                    className="h-5 w-5 rounded-md accent-amber-600"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsChunkModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Log & Continue Clock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
