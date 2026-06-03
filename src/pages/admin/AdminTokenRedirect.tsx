import { useEffect } from "react";
import { Navigate } from "react-router-dom";

const STORAGE_KEY = "admin_legacy_token";

/** @deprecated Legacy URL /admin/:token — only clears storage and requires normal login. */
export function getLegacyAdminToken(): string | undefined {
  return undefined;
}

export default function AdminTokenRedirect() {
  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return <Navigate to="/auth?next=/admin/dashboard" replace />;
}
