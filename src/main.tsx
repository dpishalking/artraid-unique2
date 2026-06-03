import { createRoot } from "react-dom/client";
import {
  bounceOAuthCallbackToSavedNextIfNeeded,
  redirectLegacyHostIfNeeded,
  restoreAuthOriginIfNeeded,
} from "@/lib/auth/redirect";
import {
  redirectIdeaLabToSubdomainIfNeeded,
  redirectWorkshopOnlyRouteIfNeeded,
} from "@/lib/navigation/ideaLabUrls";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.PROD) {
  console.info("[money-magnet] сборка UI:", __APP_UI_BUILD__);
}

if (
  !redirectLegacyHostIfNeeded() &&
  !redirectIdeaLabToSubdomainIfNeeded() &&
  !redirectWorkshopOnlyRouteIfNeeded() &&
  !bounceOAuthCallbackToSavedNextIfNeeded() &&
  !restoreAuthOriginIfNeeded()
) {
  createRoot(document.getElementById("root")!).render(<App />);
}
