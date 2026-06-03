import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CREDITS_ENABLED } from "@/config/features";

export type CreditsState = {
  balance: number | null;
  totalUsed: number;
  loading: boolean;
  refresh: () => void;
};

export function useCredits(): CreditsState {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [totalUsed, setTotalUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!CREDITS_ENABLED) {
      setBalance(null);
      setTotalUsed(0);
      setLoading(false);
      return;
    }
    if (!user) { setBalance(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("user_credits")
      .select("balance, total_used")
      .eq("user_id", user.id)
      .single();
    setBalance(data?.balance ?? 0);
    setTotalUsed(data?.total_used ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { balance, totalUsed, loading, refresh: fetch };
}
