import type { ApiResponse } from "@/types/common.types";
import {
  USER_TYPES,
  GENDERS,
  RELIGIONS,
  TEACHER_RANKS,
  ACCOUNT_STATUS,
} from "../constants";

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];
export type AccountStatus =
  (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];
export type Gender = (typeof GENDERS)[keyof typeof GENDERS];
export type Religion = (typeof RELIGIONS)[keyof typeof RELIGIONS];
export type TeacherRank = (typeof TEACHER_RANKS)[keyof typeof TEACHER_RANKS];

// Privacy Settings Enums
export type FriendRequestPolicy = string;
export type ConnectionVisibility = string;

export interface SocialLinks {
  linkedin: string | null;
  github: string | null;
  website: string | null;
  facebook: string | null;
}

export interface PrivacySettings {
  friend_request_policy: FriendRequestPolicy;
  connection_visibility: ConnectionVisibility;
}

export interface UserRestrictions {
  is_post_blocked: boolean;
  is_comment_blocked: boolean;
  is_message_blocked: boolean;
  post_restriction_reason: string | null;
  post_restricted_at: string | null;
  post_restricted_by: string | null;
  comment_restriction_reason: string | null;
  comment_restricted_at: string | null;
  comment_restricted_by: string | null;
  message_restriction_reason: string | null;
  message_restricted_at: string | null;
  message_restricted_by: string | null;
}

// Student-specific fields
export interface StudentAcademicInfo {
  student_id: string | null;
  session: string | null;
  current_semester: number | null;
  section: string | null;
}

// Teacher-specific fields
export interface TeacherAcademicInfo {
  teacher_id: string | null;
  rank?: TeacherRank;
  office_hours?: {
    day: string;
    time_range: string;
    room: string;
  }[];
}

export interface ProfileHeaderUser {
  id: string;

  // Stats
  posts_count: number;
  connections_count: number;
  followers_count: number;
  following_count: number;
  public_files_count: number;

  // Basic Info
  full_name: string;
  user_name: string;
  avatar: string | null;
  email: string;
  cover_image: string | null;
  bio: string | null;
  user_type: UserType;
  education_level: string;
  is_institutional_email: boolean;
  account_status: AccountStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// User Details (Full Profile)
export interface User {
  id: string;

  // Identity
  full_name: string;
  user_name: string;
  email: string;
  phone_number: string | null;

  // Profile
  avatar: string | null;
  cover_image: string | null;
  bio: string | null;
  gender: Gender | null;
  religion: Religion | null;

  // Stats
  posts_count: number;
  connections_count: number;
  followers_count: number;
  following_count: number;
  public_files_count: number;

  // Social & Skills
  social_links: SocialLinks | null;
  skills: string[] | null;
  interests: string[] | null;

  // Institutional
  user_type: UserType;
  education_level: string;
  is_institutional_email: boolean;

  // Status & Settings
  account_status: AccountStatus;
  friend_request_policy: FriendRequestPolicy;
  connection_visibility: ConnectionVisibility;
  is_post_blocked: boolean;
  is_comment_blocked: boolean;
  is_message_blocked: boolean;
  post_restriction_reason: string | null;
  post_restricted_at: string | null;
  post_restricted_by: string | null;
  comment_restriction_reason: string | null;
  comment_restricted_at: string | null;
  comment_restricted_by: string | null;
  message_restriction_reason: string | null;
  message_restricted_at: string | null;
  message_restricted_by: string | null;

  // Admin/Legacy
  deleted_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ====================================
// AUTH STATE
// ====================================

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
}

export type AuthResponse = ApiResponse<{
  user: AuthUser;
  meta: UserMeta;
  supabaseSession?: SupabaseSession | null;
}>;

export interface AuthUser {
  id: string;
  full_name: string;
  user_name: string;
  email: string;
  avatar: string | null;
  cover_image: string | null;
  user_type: UserType;
  education_level: string;
  is_institutional_email: boolean;
  account_status: AccountStatus;
  is_post_blocked: boolean;
  is_comment_blocked: boolean;
  is_message_blocked: boolean;
  post_restriction_reason: string | null;
  post_restricted_at: string | null;
  post_restricted_by: string | null;
  comment_restriction_reason: string | null;
  comment_restricted_at: string | null;
  comment_restricted_by: string | null;
  message_restriction_reason: string | null;
  message_restricted_at: string | null;
  message_restricted_by: string | null;
  password_changed_at: string | null;
}

export interface UserMeta {
  institution: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  is_teacher: boolean;
  is_app_admin: boolean;
  is_app_moderator: boolean;
}

// Login Types
export interface LoginType {
  email: string;
  password: string;
}

// Register Types (user_name removed as it's auto-generated)
export interface RegisterType {
  full_name: string;
  email: string;
  password: string;
  user_type: UserType;
  education_level: string;
  agree_to_terms: boolean;
}
