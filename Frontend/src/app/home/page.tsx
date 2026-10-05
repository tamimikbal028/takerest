import { ContinuousTimerWidget } from "./components/ContinuousTimerWidget";
import { DayTimeline24h } from "./components/DayTimeline24h";
import trackerHooks from "@/hooks/useTracker";
import authHooks from "@/hooks/useAuth";

const Home = () => {
  const { user } = authHooks.useUser();
  const { categories, isLoading: isCatLoading } = trackerHooks.useCategories();
  const { isLoading: isTimerLoading } = trackerHooks.useActiveTimer();
  const { logs, isLoading: isSummaryLoading } = trackerHooks.useDaySummary();

  if (isCatLoading || isTimerLoading || isSummaryLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500">
          Loading your day tracker...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Name and Date */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
          {user?.full_name || "Daily Time Tracker"}
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

      {/* 2. Active Timer Widget (Manual Start / Stop with Category/Activity Selector) */}
      <ContinuousTimerWidget categories={categories} />

      {/* 3. 24-Hour Timeline Bar & Chronological Logs */}
      <DayTimeline24h logs={logs} />
    </div>
  );
};

export default Home;
