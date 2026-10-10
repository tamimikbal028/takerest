import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import type { Location } from "react-router-dom";
import { toast } from "sonner";
import authServices from "@/services/auth.service";
import { handleMutationError } from "@/utils/errorHandler";
import type { LoginType, RegisterType } from "@/types";
import { AUTH_KEYS, USER_TYPES } from "@/constants";

// Default query options for current user
const currentUserQueryOptions = {
  retry: false,
  staleTime: 1000 * 60 * 5, // 5 mins
  gcTime: 1000 * 60 * 10,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
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
        // If not logged in, return null for a clean state
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
    onSuccess: (response) => {
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
    onSuccess: (response) => {
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
    onSuccess: (response) => {
      queryClient.setQueryData([AUTH_KEYS.CURRENT_USER], null);
      queryClient.removeQueries({ queryKey: [AUTH_KEYS.CURRENT_USER] });
      toast.success(response?.message || "Signed out successfully");
      navigate("/login");
    },
    onError: (error: unknown) => {
      queryClient.setQueryData([AUTH_KEYS.CURRENT_USER], null);
      queryClient.removeQueries({ queryKey: [AUTH_KEYS.CURRENT_USER] });
      handleMutationError(error, "Logout error, signed out locally.");
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
