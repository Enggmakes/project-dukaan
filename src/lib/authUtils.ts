/**
 * Helper to determine if a user has admin privileges.
 * Supports:
 * 1. Primary Admin configured in VITE_ADMIN_EMAIL (workspace7204@gmail.com)
 * 2. Supabase Auth User Metadata: { "role": "admin" } (set directly via Supabase Auth Dashboard)
 * 3. Supabase Auth App Metadata: { "role": "admin" }
 */
export const isUserAdmin = (user: any): boolean => {
  if (!user) return false;
  
  const email = (user.email || "").toLowerCase().trim();
  const primaryAdmin = (import.meta.env.VITE_ADMIN_EMAIL || "workspace7204@gmail.com").toLowerCase().trim();

  // Check against primary admin email
  if (email && email === primaryAdmin) {
    return true;
  }

  // Check user_metadata.role (Option 2: Supabase Auth -> Users -> User Metadata)
  const userRole = user.user_metadata?.role;
  if (typeof userRole === "string" && userRole.toLowerCase().trim() === "admin") {
    return true;
  }

  // Check app_metadata.role
  const appRole = user.app_metadata?.role;
  if (typeof appRole === "string" && appRole.toLowerCase().trim() === "admin") {
    return true;
  }

  return false;
};
