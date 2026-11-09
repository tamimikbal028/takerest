import React, { useState } from "react";
import {
  Target,
  Calendar,
  Clock,
  CalendarRange,
  Check,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import type { DailyGoal, GoalStatus, UpdateGoalPayload } from "@/types";

interface GoalListProps {
  goals: DailyGoal[];
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onToggleStatus: (goal: DailyGoal, targetStatus: GoalStatus) => void;
  onUpdateGoal: (payload: UpdateGoalPayload, onSuccess: () => void) => void;
  onDeleteGoal: (id: string) => void;
}

const formatTime12h = (timeStr?: string | null): string => {
  if (!timeStr) return "";
  try {
    const [hh, mm] = timeStr.split(":");
    let h = parseInt(hh, 10);
    const m = mm || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
};

export const GoalList: React.FC<GoalListProps> = ({
  goals,
  isLoading,
  isUpdating,
  isDeleting,
  onToggleStatus,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStartTime, setEditStartTime] = useState<string>("");
  const [editEndTime, setEditEndTime] = useState<string>("");

  const handleStartEdit = (goal: DailyGoal) => {
    setEditingId(goal.id);
    setEditTitle(goal.title);
    setEditStartTime(goal.start_time ? goal.start_time.slice(0, 5) : "");
    setEditEndTime(goal.end_time ? goal.end_time.slice(0, 5) : "");
  };

  const handleSaveEdit = (goal: DailyGoal) => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    onUpdateGoal(
      {
        id: goal.id,
        title: trimmed,
        start_time: editStartTime || null,
        end_time: editEndTime || null,
      },
      () => {
        setEditingId(null);
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Target className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-bold text-gray-800">
          এই দিনের জন্য এখনো কোনো টার্গেট যোগ করা হয়নি
        </p>
        <p className="mt-1 text-xs text-gray-400">
          উপরের বক্সে আপনার আজকের বা আগামীকালের টার্গেট লিখে যোগ করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xs">
      <div className="divide-y divide-gray-100">
        {goals.map((goal) => {
          const isAchieved = goal.status === "ACHIEVED";
          const isMissed = goal.status === "MISSED";
          const isEditingThis = editingId === goal.id;
          const hasTimeRange = Boolean(goal.start_time || goal.end_time);
          const isMultiDay = goal.start_date !== goal.end_date;

          if (isEditingThis) {
            return (
              <div
                key={goal.id}
                className="flex flex-col gap-2.5 bg-blue-50/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit(goal);
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    className="flex-1 rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-blue-600 sm:text-sm"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700"
                    />
                    <span className="text-xs text-gray-400">-</span>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleSaveEdit(goal)}
                    className="cursor-pointer rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="cursor-pointer rounded-xl bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={goal.id}
              className={`flex items-center justify-between gap-3 p-3.5 transition sm:p-4 ${
                isAchieved
                  ? "bg-emerald-50/40"
                  : isMissed
                    ? "bg-rose-50/30"
                    : "hover:bg-gray-50/70"
              }`}
            >
              {/* Left: ✓ Achieved and ✗ Missed Action Buttons + Goal Text */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* 2 Explicit Evaluation Buttons: ✓ and ✗ */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(goal, "ACHIEVED")}
                    title="পূরণ হয়েছে (Achieved)"
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border transition active:scale-95 ${
                      isAchieved
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-gray-200 bg-white text-gray-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(goal, "MISSED")}
                    title="পূরণ হয়নি (Missed)"
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border transition active:scale-95 ${
                      isMissed
                        ? "border-rose-600 bg-rose-600 text-white shadow-xs"
                        : "border-gray-200 bg-white text-gray-400 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                  >
                    <X className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Goal Title & Time Badge */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold sm:text-sm ${
                        isAchieved
                          ? "text-emerald-800"
                          : isMissed
                            ? "text-rose-500 line-through decoration-rose-500 decoration-2"
                            : "text-gray-900"
                      }`}
                    >
                      {goal.title}
                    </span>

                    {isAchieved && (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        পূরণ হয়েছে
                      </span>
                    )}

                    {isMissed && (
                      <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        পূরণ হয়নি
                      </span>
                    )}
                  </div>

                  {/* Time Range or Date Range Metadata */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-500">
                    {hasTimeRange ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-gray-700">
                        <Clock className="h-3 w-3 text-blue-600" />
                        {formatTime12h(goal.start_time)}
                        {goal.end_time
                          ? ` - ${formatTime12h(goal.end_time)}`
                          : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <Calendar className="h-3 w-3" />
                        সারাদিন
                      </span>
                    )}

                    {isMultiDay && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">
                        <CalendarRange className="h-3 w-3" />
                        {goal.start_date} → {goal.end_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Edit & Delete Buttons */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleStartEdit(goal)}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => onDeleteGoal(goal.id)}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

