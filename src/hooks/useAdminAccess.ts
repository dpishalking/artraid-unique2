import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/lib/admin/config";

const ADMIN_ROLES = new Set(["admin", "super_admin", "support", "analyst", "prompt_manager"]);

export function useAdminAccess() {
  const { user, session, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }
    if (isAdminEmail(user.email)) {
      setRole("super_admin");
      setRoleLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRole((data as { role?: string } | null)?.role ?? "user");
        setRoleLoading(false);
      })
      .catch(() => {
        setRole("user");
        setRoleLoading(false);
      });
  }, [user]);

  const isAdmin = isAdminEmail(user?.email) || ADMIN_ROLES.has(role ?? "");
  const canMutate = role === "admin" || role === "super_admin" || isAdminEmail(user?.email);

  return {
    user,
    session,
    role,
    loading: authLoading || roleLoading,
    isAdmin,
    canMutate,
    email: user?.email ?? null,
  };
}
