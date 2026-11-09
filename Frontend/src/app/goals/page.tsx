import React, { useState, useMemo } from "react";
import goalHooks from "@/hooks/useGoals";
import type {
  DailyGoal,
  GoalStatus,
  CreateGoalPayload,
  UpdateGoalPayload,
} from "@/types";
import { GoalHeaderDateNav } from "./components/GoalHeaderDateNav";
import { CreateGoalForm } from "./components/CreateGoalForm";
import { GoalSummaryBar } from "./components/GoalSummaryBar";
import { GoalList } from "./components/GoalList";

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
};

const GoalsPage: React.FC = () => {
  const todayStr = getLocalDateString();
  const tomorrowStr = getTomorrowDateString();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Queries & Mutations
  const { goals, isLoading } = goalHooks.useDailyGoals(selectedDate);
  const { mutate: createGoal, isPending: isCreating } =
    goalHooks.useCreateGoal();
  const { mutate: updateGoal, isPending: isUpdating } =
    goalHooks.useUpdateGoal();
  const { mutate: deleteGoal, isPending: isDeleting } =
    goalHooks.useDeleteGoal();

  // Date navigation
  const handleShiftDate = (days: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(getLocalDateString(d));
  };

  const formattedDateLabel = useMemo(() => {
    const d = new Date(selectedDate);
    const formatted = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (selectedDate === todayStr) return `আজকে (${formatted})`;
    if (selectedDate === tomorrowStr) return `আগামীকাল (${formatted})`;
    return formatted;
  }, [selectedDate, todayStr, tomorrowStr]);

  const handleCreateGoal = (
    payload: CreateGoalPayload,
    onSuccess: () => void
  ) => {
    createGoal(payload, { onSuccess });
  };

  const handleToggleStatus = (goal: DailyGoal, targetStatus: GoalStatus) => {
    const nextStatus: GoalStatus =
      goal.status === targetStatus ? "PENDING" : targetStatus;
    updateGoal({
      id: goal.id,
      status: nextStatus,
    });
  };

  const handleUpdateGoal = (
    payload: UpdateGoalPayload,
    onSuccess: () => void
  ) => {
    updateGoal(payload, { onSuccess });
  };

  return (
    <div className="space-y-5 pb-14">
      {/* 1. Header & Date Navigation */}
      <GoalHeaderDateNav
        selectedDate={selectedDate}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
        formattedDateLabel={formattedDateLabel}
        onSelectDate={setSelectedDate}
        onShiftDate={handleShiftDate}
      />

      {/* 2. Add New Goal Card */}
      <CreateGoalForm
        selectedDate={selectedDate}
        tomorrowStr={tomorrowStr}
        isCreating={isCreating}
        onCreateGoal={handleCreateGoal}
      />

      {/* 3. Summary Progress Bar */}
      <GoalSummaryBar goals={goals} />

      {/* 4. Goals List */}
      <GoalList
        goals={goals}
        isLoading={isLoading}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        onToggleStatus={handleToggleStatus}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={(id) => deleteGoal(id)}
      />
    </div>
  );
};

export default GoalsPage;
