import api from "@/config/axios";
import type {
  LoginType,
  ApiResponse,
  RegisterType,
  AuthResponse,
  EmptyObject,
} from "../types";

const getCurrentUser = async (): Promise<AuthResponse> => {
  const response = await api.get<AuthResponse>("/auth/current-user");
  return response.data;
};

const register = async (registerData: RegisterType): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/auth/register",
    registerData,
    { timeout: 60000 }
  );
  return response.data;
};

const login = async (loginData: LoginType): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", loginData);
  return response.data;
};

const logout = async (): Promise<ApiResponse<EmptyObject>> => {
  const response = await api.post<ApiResponse<EmptyObject>>("/auth/logout");
  return response.data;
};

const changePassword = async (data: {
  oldPassword: string;
  newPassword: string;
}): Promise<ApiResponse<EmptyObject>> => {
  const response = await api.post<ApiResponse<EmptyObject>>(
    "/auth/change-password",
    data
  );
  return response.data;
};
const authServices = {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
} as const;

export default authServices;
