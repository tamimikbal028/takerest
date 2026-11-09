export type GoalStatus = "PENDING" | "ACHIEVED" | "MISSED";

export interface DailyGoal {
  id: string;
  user_id: string;
  title: string;
  status: GoalStatus;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  start_time?: string | null; // HH:MM:SS (null if Full Day)
  end_time?: string | null; // HH:MM:SS (null if Full Day)
  notes?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalPayload {
  title: string;
  start_date: string;
  end_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string;
}

export interface UpdateGoalPayload {
  id: string;
  title?: string;
  status?: GoalStatus;
  start_date?: string;
  end_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
}

