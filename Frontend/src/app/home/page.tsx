import { useState } from "react";
import { ContinuousTimerWidget } from "./components/ContinuousTimerWidget";
import { CategoryActivitySection } from "./components/CategoryActivitySection";
import { DaySummaryMetrics } from "./components/DaySummaryMetrics";
import { DayTimeline24h } from "./components/DayTimeline24h";
import trackerHooks from "@/hooks/useTracker";
import authHooks from "@/hooks/useAuth";
import { AlertTriangle, RotateCw, X } from "lucide-react";

const Home = () => {
  const { user } = authHooks.useUser();
  const { categories, isLoading: isCatLoading } = trackerHooks.useCategories();
  const { activeTimer, isLoading: isTimerLoading } = trackerHooks.useActiveTimer();
  const { summary, logs, isLoading: isSummaryLoading } = trackerHooks.useDaySummary();
  const { mutate: switchTimer, isPending: isSwitching } = trackerHooks.useSwitchTimer();

  // Switch Activity Modal State
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState<boolean>(false);
  const [targetCategory, setTargetCategory] = useState<{ id: string; name: string } | null>(null);
  const [targetActivity, setTargetActivity] = useState<{ id: string | null; name: string } | null>(null);

  // Preceding interval details
  const [previousTitle, setPreviousTitle] = useState<string>("");
  const [previousIsWasted, setPreviousIsWasted] = useState<boolean>(false);
  const [savePrevious, setSavePrevious] = useState<boolean>(true);

  if (isCatLoading || isTimerLoading || isSummaryLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500">Loading your day tracker...</p>
      </div>
    );
  }

  // Triggered when user clicks any activity in the category launcher
  const handleInitiateSwitch = (
    categoryId: string,
    activityId: string | null,
    title: string
  ) => {
    const cat = categories.find((c) => c.id === categoryId);
    setTargetCategory(cat ? { id: cat.id, name: cat.name } : { id: categoryId, name: "Group" });
    setTargetActivity({ id: activityId, name: title });

    // Set default title for the elapsed preceding interval
    setPreviousTitle(activeTimer?.title || "Others");
    setPreviousIsWasted(false);
    setSavePrevious(true);

    setIsSwitchModalOpen(true);
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCategory) return;

    switchTimer(
      {
        category_id: targetCategory.id,
        activity_id: targetActivity?.id || null,
        title: targetActivity?.name || "Activity",
        save_previous: savePrevious,
        previous_title: previousTitle.trim() || undefined,
        previous_is_wasted: previousIsWasted,
      },
      {
        onSuccess: () => {
          setIsSwitchModalOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Greeting Header */}
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            {user?.full_name ? `${user.full_name}'s 24-Hour Day` : "Today's 24-Hour Tracker"}
          </h1>
          <p className="text-xs font-medium text-gray-500">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* 2. Continuous Active Clock Widget */}
      <ContinuousTimerWidget
        categories={categories}
        onOpenSwitchModal={() => {
          // Open selector with default category
          if (categories.length > 0) {
            handleInitiateSwitch(categories[0].id, null, categories[0].name);
          }
        }}
      />

      {/* 3. Groups & Activities Launcher */}
      <CategoryActivitySection
        categories={categories}
        activeTimer={activeTimer}
        onSwitchActivity={handleInitiateSwitch}
      />

      {/* 4. Daily Summary & Wasted Time Metrics */}
      <DaySummaryMetrics summary={summary} />

      {/* 5. 24-Hour Timeline Bar & Chronological Logs */}
      <DayTimeline24h logs={logs} />

      {/* Switch Activity Confirmation Modal */}
      {isSwitchModalOpen && targetActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Switch to: {targetActivity.name}
                </h3>
              </div>
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSwitch} className="mt-4 space-y-4">
              <p className="text-xs text-gray-600">
                You are switching the continuous timer to{" "}
                <span className="font-bold text-gray-900">
                  {targetActivity.name}
                </span>{" "}
                under{" "}
                <span className="font-bold text-blue-600">
                  {targetCategory?.name}
                </span>
                .
              </p>

              {/* Preceding Interval Save Options */}
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    Save the preceding time as a log?
                  </span>
                  <input
                    type="checkbox"
                    checked={savePrevious}
                    onChange={(e) => setSavePrevious(e.target.checked)}
                    className="h-4 w-4 rounded-md accent-blue-600"
                  />
                </label>

                {savePrevious && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700">
                        Label preceding interval as:
                      </label>
                      <input
                        type="text"
                        required
                        value={previousTitle}
                        onChange={(e) => setPreviousTitle(e.target.value)}
                        placeholder="e.g. খাবার খাওয়া, বিশ্রাম, Others"
                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Mark Previous Interval as Wasted */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <label className="flex cursor-pointer items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-900">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span className="text-xs font-bold text-amber-950">Mark preceding time as Wasted</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={previousIsWasted}
                          onChange={(e) => setPreviousIsWasted(e.target.checked)}
                          className="h-4 w-4 rounded-md accent-amber-600"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwitchModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSwitching}
                  className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSwitching ? "Switching..." : `Start ${targetActivity.name} Now`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
