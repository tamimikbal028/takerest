export interface Activity {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  color?: string | null;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string;
  is_system_default: boolean;
  sort_order: number;
  activities?: Activity[];
  created_at: string;
  updated_at: string;
}

export interface TimeLog {
  id: string;
  user_id: string;
  category_id: string;
  activity_id?: string | null;
  title: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  is_wasted: boolean;
  notes?: string | null;
  created_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  } | null;
  activities?: {
    id: string;
    name: string;
    color?: string | null;
    icon?: string;
  } | null;
}

export interface ActiveTimer {
  user_id: string;
  category_id?: string | null;
  activity_id?: string | null;
  title: string;
  started_at: string;
  is_running: boolean;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  } | null;
  activities?: {
    id: string;
    name: string;
    color?: string | null;
    icon?: string;
  } | null;
}

export interface CategoryBreakdown {
  id: string;
  name: string;
  color: string;
  durationSeconds: number;
  minutes: number;
  hours: number;
  percentage: number;
  logsCount: number;
}

export interface DaySummary {
  date: string;
  totalTrackedSeconds: number;
  totalTrackedMinutes: number;
  totalTrackedHours: number;
  totalWastedSeconds: number;
  totalWastedMinutes: number;
  totalWastedHours: number;
  categoryBreakdown: CategoryBreakdown[];
}
