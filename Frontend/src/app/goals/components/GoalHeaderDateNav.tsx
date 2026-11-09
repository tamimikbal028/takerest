import React from "react";
import { Target, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface GoalHeaderDateNavProps {
  selectedDate: string;
  todayStr: string;
  tomorrowStr: string;
  formattedDateLabel: string;
  onSelectDate: (date: string) => void;
  onShiftDate: (days: -1 | 1) => void;
}

export const GoalHeaderDateNav: React.FC<GoalHeaderDateNavProps> = ({
  selectedDate,
  todayStr,
  tomorrowStr,
  formattedDateLabel,
  onSelectDate,
  onShiftDate,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            Goals & Targets
          </h1>
          <p className="text-xs font-medium text-gray-500">
            প্রতিদিনের বা নির্দিষ্ট সময়ের টার্গেট নির্ধারণ ও মূল্যায়ন করুন
          </p>
        </div>
      </div>

      {/* Date Controls: Today, Tomorrow, Prev/Next, Date Input */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectDate(todayStr)}
          className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            selectedDate === todayStr
              ? "bg-blue-600 text-white shadow-xs"
              : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          আজকে
        </button>

        <button
          type="button"
          onClick={() => onSelectDate(tomorrowStr)}
          className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition ${
            selectedDate === tomorrowStr
              ? "bg-blue-600 text-white shadow-xs"
              : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          আগামীকাল
        </button>

        <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => onShiftDate(-1)}
            className="cursor-pointer rounded-xl p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900"
            title="আগের দিন"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <label className="relative flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-gray-800">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>{formattedDateLabel}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) onSelectDate(e.target.value);
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>

          <button
            type="button"
            onClick={() => onShiftDate(1)}
            className="cursor-pointer rounded-xl p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900"
            title="পরের দিন"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
