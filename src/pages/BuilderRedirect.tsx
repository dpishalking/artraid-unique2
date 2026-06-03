import { Navigate, useLocation } from "react-router-dom";

/** Канонический URL конструктора — /prototype */
export default function BuilderRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/prototype${search}${hash}`} replace />;
}
