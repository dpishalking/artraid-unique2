import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QUIZ_WELCOME_CREDITS } from "@/lib/quiz/constants";

/** Показывает баланс генераций (независимо от CREDITS_ENABLED). */
export function CreditsBalanceBadge({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }
    supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setBalance(data?.balance ?? null));
  }, [user]);

  if (balance == null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium ${className}`}
      title="Генерации на аккаунт"
    >
      <Zap className="h-3.5 w-3.5 text-money" />
      {balance} / {QUIZ_WELCOME_CREDITS}
    </span>
  );
}
