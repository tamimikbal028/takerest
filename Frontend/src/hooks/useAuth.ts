import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import type { Location } from "react-router-dom";
import { toast } from "sonner";
import authServices from "@/services/auth.service";
import { handleMutationError } from "@/utils/errorHandler";
import type { LoginType, RegisterType } from "@/types";
import { AUTH_KEYS, USER_TYPES } from "@/constants";
import { supabase } from "@/config/supabase";

// Default query options for current user
const currentUserQueryOptions = {
  retry: false,
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

const useUser = () => {
  const { data: authData, isLoading } = useQuery({
    queryKey: [AUTH_KEYS.CURRENT_USER],
    queryFn: async () => {
      try {
        const res = await authServices.getCurrentUser();
        // Returns { user, meta }
        return res.data;
      } catch {
        // If not logged in (401), just return null for a clean state
        return null;
      }
    },
    ...currentUserQueryOptions,
  });

  return {
    user: authData?.user ?? null,
    meta: authData?.meta ?? null,
    isAuthenticated: Boolean(authData?.user),
    isCheckingAuth: isLoading,
    is_app_admin: authData?.user?.user_type === USER_TYPES.ADMIN,
    isAppModerator: authData?.user?.user_type === USER_TYPES.MODERATOR,
  };
};

// Register
const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registerData: RegisterType) =>
      authServices.register(registerData),
    onSuccess: async (response) => {
      if (response.data?.supabaseSession) {
        try {
          await supabase.auth.setSession(response.data.supabaseSession);
        } catch (e) {
          console.error("Failed to set Supabase session on register:", e);
          toast.error("Failed to sync Supabase session.");
        }
      }
      queryClient.setQueryData([AUTH_KEYS.CURRENT_USER], response.data);
      toast.success(response.message);
      navigate("/");
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Registration failed");
    },
  });
};

// Login
const useLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loginData: LoginType) => authServices.login(loginData),
    onSuccess: async (response) => {
      if (response.data?.supabaseSession) {
        try {
          await supabase.auth.setSession(response.data.supabaseSession);
        } catch (e) {
          console.error("Failed to set Supabase session on login:", e);
          toast.error("Failed to sync Supabase session.");
        }
      }
      queryClient.setQueryData([AUTH_KEYS.CURRENT_USER], response.data);
      toast.success(response.message);

      // Extract original path from location state
      const state = location.state as { from?: Location };
      const from = state?.from?.pathname || "/";
      navigate(from, { replace: true });
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Login failed");
    },
  });
};

// Logout
const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authServices.logout(),
    onSuccess: async (response) => {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Supabase signOut error:", e);
        toast.error("Failed to sign out from Supabase.");
      }
      queryClient.setQueryData([AUTH_KEYS.CURRENT_USER], null);
      queryClient.removeQueries({ queryKey: [AUTH_KEYS.CURRENT_USER] });
      toast.success(response?.message);
      navigate("/login");
    },
    onError: async (error: unknown) => {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Supabase signOut error:", e);
        toast.error("Failed to sign out from Supabase.");
      }
      queryClient.setQueryData([AUTH_KEYS.CURRENT_USER], null);
      handleMutationError(error, "Logout failed, signed out locally.");
      navigate("/login");
    },
  });
};

// Change Password
const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      authServices.changePassword(data),
    onSuccess: (response) => {
      toast.success(response.message);
    },
    onError: (error: unknown) => {
      handleMutationError(error, "Change password failed");
    },
  });
};

const authHooks = {
  useUser,
  useRegister,
  useLogin,
  useLogout,
  useChangePassword,
} as const;

export default authHooks;
