import { supabase } from "./supabase";

/**
 * Synchronous check for admin status (quick check against email, passed role, or metadata).
 */
export const isUserAdmin = (user: any, role?: string | null): boolean => {
  if (!user) return false;

  const email = (user.email || "").toLowerCase().trim();
  const primaryAdmin = (import.meta.env.VITE_ADMIN_EMAIL || "workspace7204@gmail.com").toLowerCase().trim();

  if (email && email === primaryAdmin) return true;
  if (role && role.toLowerCase().trim() === "admin") return true;
  if (user.role && user.role.toLowerCase().trim() === "admin") return true;
  if (user.user_metadata?.role && String(user.user_metadata.role).toLowerCase().trim() === "admin") return true;
  if (user.app_metadata?.role && String(user.app_metadata.role).toLowerCase().trim() === "admin") return true;

  return false;
};

/**
 * Fetches the user's role directly from the public.users table.
 */
export const fetchUserRole = async (userId: string): Promise<string> => {
  if (!userId) return "user";
  try {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    return data?.role || "user";
  } catch {
    return "user";
  }
};

/**
 * Fully resolves admin status by checking both primary email and the public.users table in Supabase.
 */
export const checkAdminStatus = async (user: any): Promise<boolean> => {
  if (!user) return false;
  if (isUserAdmin(user)) return true;

  if (user.id) {
    const role = await fetchUserRole(user.id);
    if (role.toLowerCase() === "admin") {
      return true;
    }
  }

  return false;
};
