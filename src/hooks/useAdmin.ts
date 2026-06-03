import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/lib/admin/config";

export function useAdmin() {
  const { user, session, loading } = useAuth();
  const isAdmin = isAdminEmail(user?.email);

  return {
    user,
    session,
    loading,
    isAdmin,
    email: user?.email ?? null,
  };
}
