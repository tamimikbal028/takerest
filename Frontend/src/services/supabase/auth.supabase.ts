import { supabase } from "@/config/supabase";
import type {
  LoginType,
  ApiResponse,
  RegisterType,
  AuthResponse,
  AuthUser,
  EmptyObject,
} from "@/types";

export interface AuthUserMetadata {
  full_name?: string;
  user_name?: string;
  avatar?: string | null;
  user_type?: AuthUser["user_type"];
  education_level?: string;
  [key: string]: unknown;
}

/**
 * Format raw auth user and public.users row into AuthUser object
 */
export const formatAuthUser = (
  user: { id: string; email?: string; user_metadata?: AuthUserMetadata },
  profile?: Partial<AuthUser> | null
): AuthUser => {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    full_name: profile?.full_name || meta.full_name || "User",
    user_name:
      profile?.user_name ||
      meta.user_name ||
      user.email?.split("@")[0] ||
      "user",
    email: user.email || profile?.email || "",
    avatar: profile?.avatar || meta.avatar || null,
    cover_image: profile?.cover_image || null,
    user_type: profile?.user_type || meta.user_type || "STUDENT",
    education_level: profile?.education_level || meta.education_level || "K12",
    is_institutional_email: Boolean(profile?.is_institutional_email),
    account_status: profile?.account_status || "ACTIVE",
    is_post_blocked: Boolean(profile?.is_post_blocked),
    is_comment_blocked: Boolean(profile?.is_comment_blocked),
    is_message_blocked: Boolean(profile?.is_message_blocked),
    post_restriction_reason: profile?.post_restriction_reason || null,
    post_restricted_at: profile?.post_restricted_at || null,
    post_restricted_by: profile?.post_restricted_by || null,
    comment_restriction_reason: profile?.comment_restriction_reason || null,
    comment_restricted_at: profile?.comment_restricted_at || null,
    comment_restricted_by: profile?.comment_restricted_by || null,
    message_restriction_reason: profile?.message_restriction_reason || null,
    message_restricted_at: profile?.message_restricted_at || null,
    message_restricted_by: profile?.message_restricted_by || null,
    password_changed_at: profile?.password_changed_at || null,
  };
};

export const supabaseGetCurrentUser = async (): Promise<AuthResponse> => {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error(authError?.message || "Not authenticated");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  const formattedUser = formatAuthUser(authData.user, profile);

  return {
    statusCode: 200,
    success: true,
    message: "Current user fetched successfully",
    data: {
      user: formattedUser,
      meta: {
        institution: null,
        department: null,
        is_teacher: formattedUser.user_type === "TEACHER",
        is_app_admin: formattedUser.user_type === "ADMIN",
        is_app_moderator: formattedUser.user_type === "MODERATOR",
      },
    },
  };
};

export const supabaseRegister = async (
  registerData: RegisterType
): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signUp({
    email: registerData.email,
    password: registerData.password,
    options: {
      data: {
        full_name: registerData.full_name,
        user_type: registerData.user_type,
        education_level: registerData.education_level,
        agree_to_terms: registerData.agree_to_terms,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Registration failed. Please try again.");
  }

  // Allow trigger (handle_new_user) up to ~600ms to insert profile
  let profile = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: p } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (p) {
      profile = p;
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const formattedUser = formatAuthUser(data.user, profile);

  return {
    statusCode: 201,
    success: true,
    message: "Registration successful!",
    data: {
      user: formattedUser,
      meta: {
        institution: null,
        department: null,
        is_teacher: formattedUser.user_type === "TEACHER",
        is_app_admin: formattedUser.user_type === "ADMIN",
        is_app_moderator: formattedUser.user_type === "MODERATOR",
      },
    },
  };
};

export const supabaseLogin = async (
  loginData: LoginType
): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginData.email,
    password: loginData.password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Login failed. User session not found.");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  const formattedUser = formatAuthUser(data.user, profile);

  return {
    statusCode: 200,
    success: true,
    message: "Login successful!",
    data: {
      user: formattedUser,
      meta: {
        institution: null,
        department: null,
        is_teacher: formattedUser.user_type === "TEACHER",
        is_app_admin: formattedUser.user_type === "ADMIN",
        is_app_moderator: formattedUser.user_type === "MODERATOR",
      },
    },
  };
};

export const supabaseLogout = async (): Promise<ApiResponse<EmptyObject>> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn("Supabase signOut notice:", error.message);
  }

  return {
    statusCode: 200,
    success: true,
    message: "Logged out successfully",
    data: {},
  };
};

export const supabaseChangePassword = async (data: {
  oldPassword: string;
  newPassword: string;
}): Promise<ApiResponse<EmptyObject>> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const email = sessionData.session?.user?.email;

  if (!email) {
    throw new Error("You must be logged in to change your password.");
  }

  // 1. Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: data.oldPassword,
  });

  if (signInError) {
    throw new Error("Current password is incorrect.");
  }

  // 2. Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (updateError) {
    throw updateError;
  }

  return {
    statusCode: 200,
    success: true,
    message: "Password changed successfully",
    data: {},
  };
};
