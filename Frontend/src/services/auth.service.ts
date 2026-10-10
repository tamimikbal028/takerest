import {
  supabaseGetCurrentUser,
  supabaseRegister,
  supabaseLogin,
  supabaseLogout,
  supabaseChangePassword,
} from "./supabase/auth.supabase";

const authServices = {
  getCurrentUser: supabaseGetCurrentUser,
  register: supabaseRegister,
  login: supabaseLogin,
  logout: supabaseLogout,
  changePassword: supabaseChangePassword,
} as const;

export default authServices;
