// Account Status
export const ACCOUNT_STATUS = {
  ACTIVE: "ACTIVE",
  DELETED: "DELETED",
};

export const USER_TYPES = {
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
};

export const EDUCATION_LEVELS = {
  UNIVERSITY: "UNIVERSITY",
  K12: "K12",
};

export const TEACHER_RANKS = {
  PROFESSOR: "PROFESSOR",
  ASSOCIATE_PROFESSOR: "ASSOCIATE_PROFESSOR",
  ASSISTANT_PROFESSOR: "ASSISTANT_PROFESSOR",
  LECTURER: "LECTURER",
  INSTRUCTOR: "INSTRUCTOR",
};

export const GENDERS = {
  MALE: "MALE",
  FEMALE: "FEMALE",
};

export const RELIGIONS = {
  ISLAM: "ISLAM",
  HINDU: "HINDU",
  CHRISTIAN: "CHRISTIAN",
  OTHERS: "OTHERS",
};

// --- Projections ---
/** Supabase public.users columns for auth/session (snake_case). */
export const AUTH_USER_DB_SELECT =
  "id, full_name, user_name, email, avatar, user_type, education_level, is_institutional_email, account_status, password_changed_at, is_post_blocked, is_comment_blocked, is_message_blocked";

/** Supabase public.users columns for profile header display. */
export const USER_PROFILE_HEADER_SELECT =
  "id, full_name, user_name, email, avatar, cover_image, bio, user_type, education_level, is_institutional_email, account_status, connections_count, followers_count, following_count, posts_count, public_files_count, created_at, updated_at";
