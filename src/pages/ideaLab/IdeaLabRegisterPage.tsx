import { useCallback, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { rememberAuthOrigin } from "@/lib/auth/redirect";
import { IdeaLabRegisterBelowFold } from "@/components/ideaLab/IdeaLabRegisterBelowFold";
import { IdeaLabRegisterSplit } from "@/components/ideaLab/IdeaLabRegisterSplit";
import { ideaLabDashboardPath } from "@/lib/ideaLab/constants";

export default function IdeaLabRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || ideaLabDashboardPath();

  useEffect(() => {
    rememberAuthOrigin(next);
  }, [next]);

  const scrollToSignup = useCallback(() => {
    const el = document.getElementById("signup");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      el?.querySelector<HTMLInputElement>("input")?.focus();
    }, 400);
  }, []);

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={next.startsWith("/") ? next : ideaLabDashboardPath()} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <IdeaLabRegisterSplit redirectNext={next} onStart={scrollToSignup} />
      <IdeaLabRegisterBelowFold onStart={scrollToSignup} />
    </div>
  );
}
