import { Fragment, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { fetchAnalysisLogs } from "@/lib/admin/api";
import { useAdmin } from "@/hooks/useAdmin";

type Feedback = {
  id: string;
  audit_id: string;
  nps: number | null;
  thumb: "up" | "down" | null;
  comment: string | null;
  implemented: boolean | null;
  result_metric: string | null;
  created_at: string;
};

type LogRow = {
  id: string;
  url: string;
  original_url: string | null;
  referer: string | null;
  user_agent: string | null;
  ip: string | null;
  status: string;
  error: string | null;
  created_at: string;
  audit: unknown;
  feedback?: Feedback[];
};

function npsTone(n: number): string {
  if (n <= 6) return "bg-destructive/15 text-destructive border-destructive/30";
  if (n <= 8) return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
  return "bg-money/15 text-money border-money/30";
}

export default function Backlog() {
  const { token: legacyToken } = useParams();
  const { loading: authLoading, isAdmin, session } = useAdmin();
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Бэклог анализов";
    if (authLoading) return;
    if (!legacyToken && !session) return;
    if (!legacyToken && session && !isAdmin) return;

    (async () => {
      try {
        const data = await fetchAnalysisLogs(legacyToken);
        setLogs(data.logs as LogRow[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка сети");
      }
    })();
  }, [authLoading, legacyToken, session, isAdmin]);

  if (!authLoading && !legacyToken && !session) {
    return <Navigate to="/auth?next=/backlog" replace />;
  }

  if (!authLoading && !legacyToken && session && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">Доступ закрыт</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!logs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Загружаем…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Бэклог анализов</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Всего записей: {logs.length}
            </p>
          </div>
          <Link
            to={`/prototype-backlog/${token}`}
            className="text-xs text-primary hover:underline"
          >
            Бэклог прототипов →
          </Link>
        </header>

        <div className="overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Когда</th>
                <th className="px-4 py-3 font-semibold">Сайт</th>
                <th className="px-4 py-3 font-semibold">Реферер</th>
                <th className="px-4 py-3 font-semibold">IP</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="px-4 py-3 font-semibold">Оценка</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Пока запросов нет
                  </td>
                </tr>
              )}
              {logs.map((row) => {
                const fb = row.feedback ?? [];
                const npsValues = fb.map((f) => f.nps).filter((n): n is number => typeof n === "number");
                const avgNps =
                  npsValues.length > 0
                    ? Math.round((npsValues.reduce((a, b) => a + b, 0) / npsValues.length) * 10) / 10
                    : null;
                const ups = fb.filter((f) => f.thumb === "up").length;
                const downs = fb.filter((f) => f.thumb === "down").length;
                const hasComments = fb.some((f) => f.comment && f.comment.trim().length > 0);
                return (
                <Fragment key={row.id}>
                  <tr className="border-t border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(row.created_at).toLocaleString("ru-RU")}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {row.original_url || row.url}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground break-all max-w-[200px]">
                      {row.referer || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {row.ip || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.status === "success"
                            ? "rounded-full bg-money/15 text-money px-2 py-0.5 text-xs font-medium"
                            : "rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-xs font-medium"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fb.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {avgNps !== null && (
                            <span
                              className={`rounded-md border px-1.5 py-0.5 font-semibold ${npsTone(Math.round(avgNps))}`}
                              title={`NPS, отзывов: ${npsValues.length}`}
                            >
                              NPS {avgNps}
                            </span>
                          )}
                          {ups > 0 && (
                            <span className="rounded-md border border-money/30 bg-money/10 px-1.5 py-0.5 text-money">
                              👍 {ups}
                            </span>
                          )}
                          {downs > 0 && (
                            <span className="rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-destructive">
                              👎 {downs}
                            </span>
                          )}
                          {hasComments && (
                            <span className="rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-muted-foreground">
                              💬
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setOpenId(openId === row.id ? null : row.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        {openId === row.id ? "Скрыть" : "JSON"}
                      </button>
                    </td>
                  </tr>
                  {openId === row.id && (
                    <tr className="border-t border-border/60 bg-background/40">
                      <td colSpan={7} className="px-4 py-3 space-y-4">
                        {fb.length > 0 && (
                          <div>
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Отзывы ({fb.length})
                            </div>
                            <div className="space-y-2">
                              {fb.map((f) => (
                                <div
                                  key={f.id}
                                  className="rounded-md border border-border/60 bg-secondary/30 p-3 text-xs"
                                >
                                  <div className="mb-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                                    <span>{new Date(f.created_at).toLocaleString("ru-RU")}</span>
                                    {f.nps !== null && (
                                      <span
                                        className={`rounded-md border px-1.5 py-0.5 font-semibold ${npsTone(f.nps)}`}
                                      >
                                        NPS {f.nps}
                                      </span>
                                    )}
                                    {f.thumb === "up" && (
                                      <span className="rounded-md border border-money/30 bg-money/10 px-1.5 py-0.5 text-money">
                                        👍 полезно
                                      </span>
                                    )}
                                    {f.thumb === "down" && (
                                      <span className="rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-destructive">
                                        👎 не очень
                                      </span>
                                    )}
                                    {f.implemented && (
                                      <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-primary">
                                        внедрено
                                      </span>
                                    )}
                                  </div>
                                  {f.comment && (
                                    <div className="whitespace-pre-wrap text-foreground/90">
                                      {f.comment}
                                    </div>
                                  )}
                                  {f.result_metric && (
                                    <div className="mt-1 text-muted-foreground">
                                      Результат: {f.result_metric}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <details>
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            JSON анализа
                          </summary>
                          <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-secondary/40 p-3 text-xs">
                            {JSON.stringify(row.audit ?? row.error, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}