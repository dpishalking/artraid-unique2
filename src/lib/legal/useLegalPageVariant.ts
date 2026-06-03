import { useLocation } from "react-router-dom";
import { isIdeaLabHost } from "@/constants/site";

export function useLegalPageVariant(): "default" | "idea-lab" {
  const { pathname } = useLocation();
  if (isIdeaLabHost()) return "idea-lab";
  if (pathname.startsWith("/idea-lab")) return "idea-lab";
  return "default";
}
