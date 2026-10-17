import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Clock,
  Sparkles,
  ChevronDown,
  Check,
  Calendar,
  AlertCircle,
  Tag,
  FileText,
} from "lucide-react";
import trackerHooks from "@/hooks/useTracker";
import type { Category } from "@/types";

interface AddUntrackedLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotStart: Date;
  slotEnd: Date;
  activeDate: string; // "YYYY-MM-DD"
  categories: Category[];
}

const pad = (n: number) => String(n).padStart(2, "0");

const formatToTimeString = (d: Date): string => {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatTimeDisplay = (d: Date): string => {
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDurationMins = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return "0m";
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

export const AddUntrackedLogModal: React.FC<AddUntrackedLogModalProps> = ({
  isOpen,
  onClose,
  slotStart,
  slotEnd,
  activeDate,
  categories,
}) => {
  const { mutate: createTimeLog, isPending } = trackerHooks.useCreateTimeLog();

  const formattedActiveDate = useMemo(() => {
    if (!activeDate) return "";
    const [year, month, day] = activeDate.split("-").map(Number);
    if (!year || !month || !day) return activeDate;
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [activeDate]);

  const isEndNextDayMidnight = useMemo(() => {
    return (
      slotEnd.getDate() !== slotStart.getDate() &&
      slotEnd.getHours() === 0 &&
      slotEnd.getMinutes() === 0
    );
  }, [slotStart, slotEnd]);

  const slotMinTimeStr = useMemo(
    () => formatToTimeString(slotStart),
    [slotStart]
  );
  const slotMaxTimeStr = useMemo(() => {
    return isEndNextDayMidnight ? "23:59" : formatToTimeString(slotEnd);
  }, [isEndNextDayMidnight, slotEnd]);

  const [startTime, setStartTime] = useState<string>(slotMinTimeStr);
  const [endTime, setEndTime] = useState<string>(slotMaxTimeStr);
  const [title, setTitle] = useState<string>("");
  const [isTitleCustom, setIsTitleCustom] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset form whenever slot opens or changes
  useEffect(() => {
    if (isOpen) {
      setStartTime(slotMinTimeStr);
      setEndTime(slotMaxTimeStr);
      setIsTitleCustom(false);
      setNotes("");

      // Find first category/activity to pre-select
      if (categories.length > 0) {
        let defaultKey = `cat_${categories[0].id}`;
        let defaultTitle = categories[0].name;

        for (const cat of categories) {
          if (cat.activities && cat.activities.length > 0) {
            defaultKey = `act_${cat.id}_${cat.activities[0].id}`;
            defaultTitle = cat.activities[0].name;
            break;
          }
        }

        setSelectedKey(defaultKey);
        setTitle(defaultTitle);
      }
    }
  }, [isOpen, slotMinTimeStr, slotMaxTimeStr, categories]);

  // Handle outside click for custom activity dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Selected Category / Activity resolution
  const selectedInfo = useMemo(() => {
    if (!selectedKey) return null;
    if (selectedKey.startsWith("act_")) {
      const [, catId, actId] = selectedKey.split("_");
      const cat = categories.find((c) => c.id === catId);
      const act = cat?.activities?.find((a) => a.id === actId);
      if (act && cat) {
        return {
          categoryId: cat.id,
          activityId: act.id,
          title: act.name,
          categoryName: cat.name,
          color: cat.color || "#3B82F6",
        };
      }
    } else if (selectedKey.startsWith("cat_")) {
      const [, catId] = selectedKey.split("_");
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        return {
          categoryId: cat.id,
          activityId: null,
          title: cat.name,
          categoryName: cat.name,
          color: cat.color || "#3B82F6",
        };
      }
    }
    return null;
  }, [categories, selectedKey]);

  // Time calculations
  const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
  const slotEndMinutes = isEndNextDayMidnight
    ? 1440
    : slotEnd.getHours() * 60 + slotEnd.getMinutes();
  const totalSlotMinutes = Math.max(1, slotEndMinutes - slotStartMinutes);

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startTotalMinutes =
    !isNaN(startH) && !isNaN(startM) ? startH * 60 + startM : -1;
  const endTotalMinutes =
    !isNaN(endH) && !isNaN(endM)
      ? isEndNextDayMidnight && endTime === "23:59"
        ? 1440
        : endH * 60 + endM
      : -1;

  // Real-time validation
  const validationError = useMemo(() => {
    if (startTotalMinutes < 0 || endTotalMinutes < 0) {
      return "Please select valid start and end times";
    }
    if (startTotalMinutes < slotStartMinutes) {
      return `Start time cannot be earlier than ${formatTimeDisplay(slotStart)}`;
    }
    if (endTotalMinutes > slotEndMinutes) {
      return `End time cannot be later than ${formatTimeDisplay(slotEnd)}`;
    }
    if (endTotalMinutes <= startTotalMinutes) {
      return "End time must be later than start time";
    }
    if (endTotalMinutes - startTotalMinutes < 1) {
      return "Duration must be at least 1 minute";
    }
    return null;
  }, [
    startTotalMinutes,
    endTotalMinutes,
    slotStartMinutes,
    slotEndMinutes,
    slotStart,
    slotEnd,
  ]);

  const selectedDurationMinutes =
    !validationError &&
    startTotalMinutes >= 0 &&
    endTotalMinutes > startTotalMinutes
      ? endTotalMinutes - startTotalMinutes
      : 0;

  const remainingBeforeMinutes = Math.max(
    0,
    startTotalMinutes - slotStartMinutes
  );
  const remainingAfterMinutes = Math.max(0, slotEndMinutes - endTotalMinutes);

  // Preset Buttons
  const presets = useMemo(() => {
    const list: Array<{ label: string; start: string; end: string }> = [
      {
        label: `Full Slot (${formatDurationMins(totalSlotMinutes)})`,
        start: slotMinTimeStr,
        end: slotMaxTimeStr,
      },
    ];

    if (totalSlotMinutes >= 45) {
      const first30End = slotStartMinutes + 30;
      list.push({
        label: "First 30m",
        start: slotMinTimeStr,
        end: `${pad(Math.floor(first30End / 60))}:${pad(first30End % 60)}`,
      });

      const last30Start = slotEndMinutes - 30;
      list.push({
        label: "Last 30m",
        start: `${pad(Math.floor(last30Start / 60))}:${pad(last30Start % 60)}`,
        end: slotMaxTimeStr,
      });
    }

    if (totalSlotMinutes >= 90) {
      const first60End = slotStartMinutes + 60;
      list.push({
        label: "First 1 hour",
        start: slotMinTimeStr,
        end: `${pad(Math.floor(first60End / 60))}:${pad(first60End % 60)}`,
      });

      const last60Start = slotEndMinutes - 60;
      list.push({
        label: "Last 1 hour",
        start: `${pad(Math.floor(last60Start / 60))}:${pad(last60Start % 60)}`,
        end: slotMaxTimeStr,
      });
    }

    return list;
  }, [
    totalSlotMinutes,
    slotMinTimeStr,
    slotMaxTimeStr,
    slotStartMinutes,
    slotEndMinutes,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || !selectedInfo) return;
    if (!title.trim()) return;

    const [yearNum, monthNum, dayNum] = activeDate.split("-").map(Number);
    const startDate = new Date(
      yearNum,
      monthNum - 1,
      dayNum,
      startH,
      startM,
      0,
      0
    );

    let endDate: Date;
    if (isEndNextDayMidnight && endTime === "23:59") {
      endDate = new Date(yearNum, monthNum - 1, dayNum + 1, 0, 0, 0, 0);
    } else {
      endDate = new Date(yearNum, monthNum - 1, dayNum, endH, endM, 0, 0);
    }

    createTimeLog(
      {
        category_id: selectedInfo.categoryId,
        activity_id: selectedInfo.activityId,
        title: title.trim(),
        started_at: startDate.toISOString(),
        ended_at: endDate.toISOString(),
        notes: notes.trim() || null,
        is_wasted: false,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-xs duration-200 sm:p-4 md:p-6">
      <div
        className="relative my-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base leading-tight font-bold text-gray-900 sm:text-lg">
                Log Untracked Time
              </h2>
              <p className="text-xs text-gray-400">
                Log any sub-range within this untracked window
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {/* Scrollable Body */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-5 sm:p-6">
            {/* Slot Range Banner */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3 sm:p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  Available Untracked Slot
                </span>
                <span className="font-mono font-bold text-blue-700">
                  {formatDurationMins(totalSlotMinutes)} Total
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-blue-800">
                <span className="font-mono font-medium">
                  {formatTimeDisplay(slotStart)} – {formatTimeDisplay(slotEnd)}
                </span>
                <span className="text-[11px] font-semibold text-blue-600/90">
                  {formattedActiveDate}
                </span>
              </div>

              {/* Visual Subrange Bar */}
              <div className="mt-2.5">
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-blue-200/50">
                  {!validationError && totalSlotMinutes > 0 && (
                    <div
                      className="absolute top-0 bottom-0 rounded-full transition-all duration-300"
                      style={{
                        left: `${Math.max(0, ((startTotalMinutes - slotStartMinutes) / totalSlotMinutes) * 100)}%`,
                        width: `${Math.min(100, (selectedDurationMinutes / totalSlotMinutes) * 100)}%`,
                        backgroundColor: selectedInfo?.color || "#2563EB",
                      }}
                    />
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-blue-600/90">
                  <span>
                    {remainingBeforeMinutes > 0
                      ? `+${formatDurationMins(remainingBeforeMinutes)} untracked before`
                      : "Starts at slot opening"}
                  </span>
                  <span>
                    {remainingAfterMinutes > 0
                      ? `+${formatDurationMins(remainingAfterMinutes)} untracked after`
                      : "Ends at slot closing"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                  Quick Selection
                </label>
                <span className="text-[10px] text-gray-400">
                  Presets fit within untracked range
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                  const isSelected =
                    startTime === preset.start && endTime === preset.end;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setStartTime(preset.start);
                        setEndTime(preset.end);
                      }}
                      className={`cursor-pointer rounded-xl border px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 font-bold text-blue-700 shadow-2xs"
                          : "border-gray-200 bg-gray-50/70 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start and End Time Inputs */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                Time Range (Sub-range)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-600">
                    From (Start)
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    min={slotMinTimeStr}
                    max={slotMaxTimeStr}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 font-mono text-sm font-bold text-gray-800 transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-600">
                    To (End)
                  </span>
                  <input
                    type="time"
                    value={endTime}
                    min={slotMinTimeStr}
                    max={slotMaxTimeStr}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 font-mono text-sm font-bold text-gray-800 transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Validation / Duration Banner */}
              <div className="mt-2">
                {validationError ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-gray-100/70 px-3 py-1.5 text-xs">
                    <span className="font-medium text-gray-600">
                      Logged Duration:
                    </span>
                    <span className="font-mono font-bold text-gray-900">
                      {formatDurationMins(selectedDurationMinutes)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category & Activity Selector */}
            <div ref={dropdownRef} className="relative">
              <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                Category & Activity *
              </label>

              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-white px-3.5 text-left transition ${
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
                    {selectedInfo?.title || "Choose Category & Activity"}
                  </span>
                  {selectedInfo?.categoryName &&
                    selectedInfo.title !== selectedInfo.categoryName && (
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

              {isDropdownOpen && (
                <div className="hide-scrollbar absolute top-full left-0 z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl ring-1 ring-black/5">
                  {categories.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400">
                      No categories found
                    </div>
                  ) : (
                    categories.map((c) => {
                      const activities = c.activities || [];
                      return (
                        <div key={c.id} className="py-1 first:pt-0 last:pb-0">
                          {/* Category header */}
                          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              <span className="truncate">{c.name}</span>
                            </div>

                            {/* Allow picking category directly */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKey(`cat_${c.id}`);
                                if (!isTitleCustom) {
                                  setTitle(c.name);
                                }
                                setIsDropdownOpen(false);
                              }}
                              className={`cursor-pointer text-[10px] font-semibold transition hover:underline ${
                                selectedKey === `cat_${c.id}`
                                  ? "font-bold text-blue-700"
                                  : "text-blue-600"
                              }`}
                            >
                              {selectedKey === `cat_${c.id}`
                                ? "✓ Selected"
                                : "Select General"}
                            </button>
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
                                    if (!isTitleCustom) {
                                      setTitle(act.name);
                                    }
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
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Title input */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                Log Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsTitleCustom(true);
                  }}
                  placeholder="What did you do during this time?"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden sm:text-sm"
                />
                <Tag className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-300" />
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                Notes (Optional)
              </label>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Add any additional details or progress..."
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-800 transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                />
                <FileText className="pointer-events-none absolute top-3 right-3 h-3.5 w-3.5 text-gray-300" />
              </div>
            </div>
          </div>

          {/* Modal Footer / Actions (Sticky) */}
          <div className="z-10 flex shrink-0 items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/70 px-5 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                Boolean(validationError) ||
                !title.trim() ||
                !selectedInfo ||
                isPending
              }
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Add Time Log</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
