export const CATEGORY_SELECT =
  "id, user_id, name, color, icon, is_system_default, sort_order, created_at, updated_at";

export const ACTIVITY_SELECT =
  "id, user_id, category_id, name, color, icon, sort_order, created_at, updated_at";

export const TIME_LOG_SELECT =
  "id, user_id, category_id, activity_id, title, started_at, ended_at, duration_seconds, is_wasted, notes, created_at, categories(id, name, color, icon), activities(id, name, color, icon)";

export const ACTIVE_TIMER_SELECT =
  "user_id, category_id, activity_id, title, started_at, is_running, updated_at, categories(id, name, color, icon), activities(id, name, color, icon)";
