import { ContinuousTimerWidget } from "./components/ContinuousTimerWidget";
import { DayTimeline24h } from "./components/DayTimeline24h";
import trackerHooks from "@/hooks/useTracker";
import authHooks from "@/hooks/useAuth";
import { CheckSquare, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const { user } = authHooks.useUser();
  const { categories, isLoading: isCatLoading } = trackerHooks.useCategories();
  const { isLoading: isTimerLoading } = trackerHooks.useActiveTimer();
  const { logs, isLoading: isSummaryLoading } = trackerHooks.useDaySummary();

  if (isCatLoading || isTimerLoading || isSummaryLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-gray-500">Loading your day tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with direct links to Statistics and Activities */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            {user?.full_name ? `${user.full_name}'s Tracker` : "Daily Time Tracker"}
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

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/statistics"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs transition hover:bg-gray-50 active:scale-95"
          >
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span>Statistics</span>
          </Link>
          <Link
            to="/activities"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs transition hover:bg-gray-50 active:scale-95"
          >
            <CheckSquare className="h-4 w-4 text-blue-600" />
            <span>Manage Activities</span>
          </Link>
        </div>
      </div>

      {/* 2. Active Timer Widget (Manual Start / Stop with Category/Activity Selector) */}
      <ContinuousTimerWidget categories={categories} />

      {/* 3. 24-Hour Timeline Bar & Chronological Logs */}
      <DayTimeline24h logs={logs} />
    </div>
  );
};

export default Home;
