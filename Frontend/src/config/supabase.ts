import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getActiveUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    throw error || new Error("No active auth session found.");
  }
  return data.session.user.id;
};
