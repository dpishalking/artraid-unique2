import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { flowExitHome } from "@/lib/navigation/flowExit";
import { AuditDashboard, type Audit } from "@/components/AuditDashboard";
import { StickyNps } from "@/components/audit/StickyNps";
import { SiteChromeFooter } from "@/components/layout/SiteChromeFooter";
import { supabase } from "@/integrations/supabase/client";
import { useReportPageMeta } from "@/lib/share/useReportPageMeta";

type SharedPayload = {
  audit?: Audit;
  siteUrl?: string;
  error?: string;
  createdAt?: string;
};

export default function SharedReport() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke<SharedPayload>("get-shared-report", {
          body: { id },
        });
        if (cancelled) return;

        if (fnErr) {
          setAudit(null);
          setError(fnErr.message || "Не удалось загрузить отчёт. Проверьте соединение и попробуйте снова.");
          return;
        }

        if (data?.error || !data?.audit) {
          setAudit(null);
          setError(data?.error === "Not found" ? "Отчёт не найден." : data?.error || "Отчёт не найден или ещё не готов.");
          return;
        }

        setAudit(data.audit);
        setSiteUrl(data.siteUrl);
      } catch (e) {
        if (!cancelled) {
          setAudit(null);
          setError(e instanceof Error ? e.message : "Не удалось загрузить отчёт.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useReportPageMeta(audit, siteUrl, id);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загружаем отчёт…
      </main>
    );
  }
  if (error || !audit) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h1 className="font-display text-xl font-semibold">Отчёт не найден</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {error || "Возможно, ссылка устарела или была неверной."}
        </p>
        <a href="/" className="mt-2 text-sm text-primary underline-offset-4 hover:underline">
          На главную — сделать новый разбор
        </a>
      </main>
    );
  }

  return (
    <div className="flex flex-col">
      <FlowPageHeader
        exit={flowExitHome()}
        title="Отчёт аудита"
        stackBelowProductNav
        showHomeLink
      >
        <Button size="sm" className="h-8 bg-gradient-money text-primary-foreground text-xs font-semibold" asChild>
          <Link to="/audit">
            <ScanSearch className="h-3.5 w-3.5 mr-1.5" />
            Сделать свой разбор
          </Link>
        </Button>
      </FlowPageHeader>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <AuditDashboard audit={audit} siteUrl={siteUrl} onReset={() => {}} readOnly shareId={id} />
        </div>
        {id && <StickyNps auditId={id} />}
      </main>
      <SiteChromeFooter showAuditDisclaimer />
    </div>
  );
}