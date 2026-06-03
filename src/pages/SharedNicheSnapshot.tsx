import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, AlertCircle, Map, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { flowExitHome } from "@/lib/navigation/flowExit";
import { SiteChromeFooter } from "@/components/layout/SiteChromeFooter";
import { supabase } from "@/integrations/supabase/client";
import { normalizeNicheSnapshot } from "@/lib/competitors/normalize";
import type { NicheSnapshot } from "@/lib/competitors/types";
import { NicheSnapshotDashboard } from "@/components/competitors/NicheSnapshotDashboard";

type Payload = {
  snapshot?: Record<string, unknown>;
  error?: string;
};

export default function SharedNicheSnapshot() {
  const { shareId } = useParams<{ shareId: string }>();
  const [snapshot, setSnapshot] = useState<NicheSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke<Payload>(
          "get-shared-niche-snapshot",
          { body: { share_id: shareId } },
        );
        if (cancelled) return;

        if (fnErr) {
          setError(fnErr.message || "Не удалось загрузить карту ниши.");
          return;
        }
        if (data?.error || !data?.snapshot) {
          setError(
            data?.error === "Not found"
              ? "Карта ниши не найдена или ещё не опубликована."
              : data?.error || "Карта не найдена.",
          );
          return;
        }

        setSnapshot(normalizeNicheSnapshot(data.snapshot));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось загрузить карту.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загружаем карту ниши…
      </main>
    );
  }

  if (error || !snapshot) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-md">{error ?? "Карта не найдена."}</p>
        <Button asChild variant="outline">
          <Link to="/">На главную</Link>
        </Button>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <FlowPageHeader exit={flowExitHome()} title="Карта ниши" stackBelowProductNav showHomeLink />
      <main className="container mx-auto max-w-6xl flex-1 px-4 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Карта позиционирования ниши
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Публичный snapshot · {new Date(snapshot.generated_at).toLocaleString("ru-RU")}
          </p>
        </div>

        <NicheSnapshotDashboard
          snapshot={snapshot}
          footer={
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Хотите такую же карту для своего проекта?
              </p>
              <Button asChild>
                <Link to="/audit">
                  <ScanSearch className="h-4 w-4 mr-2" />
                  Бесплатный аудит сайта
                </Link>
              </Button>
            </div>
          }
        />
      </main>
      <SiteChromeFooter />
    </div>
  );
}
