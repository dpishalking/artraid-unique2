import { Navigate } from "react-router-dom";

/** @deprecated Используйте /admin/dashboard */
export default function AdminDashboard() {
  return <Navigate to="/admin/dashboard" replace />;
}
