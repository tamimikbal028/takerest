import React, { useState } from "react";
import { Plus, Calendar, Clock, CalendarRange } from "lucide-react";
import type { CreateGoalPayload } from "@/types";

type TimingMode = "FULL_DAY" | "TIME_RANGE" | "DATE_RANGE";

interface CreateGoalFormProps {
  selectedDate: string;
  tomorrowStr: string;
  isCreating: boolean;
  onCreateGoal: (payload: CreateGoalPayload, onSuccess: () => void) => void;
}

export const CreateGoalForm: React.FC<CreateGoalFormProps> = ({
  selectedDate,
  tomorrowStr,
  isCreating,
  onCreateGoal,
}) => {
  const [title, setTitle] = useState("");
  const [timingMode, setTimingMode] = useState<TimingMode>("FULL_DAY");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [rangeEndDate, setRangeEndDate] = useState<string>(tomorrowStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    onCreateGoal(
      {
        title: trimmed,
        start_date: selectedDate,
        end_date:
          timingMode === "DATE_RANGE" && rangeEndDate >= selectedDate
            ? rangeEndDate
            : selectedDate,
        start_time: timingMode === "TIME_RANGE" ? startTime : null,
        end_time: timingMode === "TIME_RANGE" ? endTime : null,
      },
      () => {
        setTitle("");
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-2xs sm:p-5"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="নতুন টার্গেট লিখুন..."
          className="flex-1 rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-xs font-semibold text-gray-900 transition outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/15 sm:text-sm"
        />

        <button
          type="submit"
          disabled={isCreating || !title.trim()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>টার্গেট যোগ করুন</span>
        </button>
      </div>

      {/* Timing Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-bold text-gray-500">সময়কাল:</span>
          <button
            type="button"
            onClick={() => setTimingMode("FULL_DAY")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition ${
              timingMode === "FULL_DAY"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>সারাদিন (Full Day)</span>
          </button>

          <button
            type="button"
            onClick={() => setTimingMode("TIME_RANGE")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition ${
              timingMode === "TIME_RANGE"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>নির্দিষ্ট টাইম রেঞ্জ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTimingMode("DATE_RANGE");
              if (rangeEndDate < selectedDate) {
                setRangeEndDate(selectedDate);
              }
            }}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition ${
              timingMode === "DATE_RANGE"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <CalendarRange className="h-3 w-3" />
            <span>একাধিক দিন (Date Range)</span>
          </button>
        </div>

        {/* Conditional Time Range Inputs */}
        {timingMode === "TIME_RANGE" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-600">শুরু:</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs font-bold text-gray-400">থেকে</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-600">শেষ:</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Conditional Date Range Inputs */}
        {timingMode === "DATE_RANGE" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-1.5">
            <span className="text-[11px] font-bold text-gray-600">
              {selectedDate} থেকে
            </span>
            <input
              type="date"
              min={selectedDate}
              value={rangeEndDate}
              onChange={(e) => setRangeEndDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:border-blue-500"
            />
            <span className="text-[11px] font-bold text-gray-600">পর্যন্ত</span>
          </div>
        )}
      </div>
    </form>
  );
};
