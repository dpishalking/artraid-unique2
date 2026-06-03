import { Fragment, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { fetchPrototypeLogs } from "@/lib/admin/api";
import { useAdmin } from "@/hooks/useAdmin";

type Brief = {
  niche?: string;
  product?: string;
  audience?: string;
  enemy?: string;
  mechanism?: string;
  bigidea?: string;
  guarantee?: string;
  traffic?: string;
  format?: string;
};

type Row = {
  id: string;
  user_id: string | null;
  status: "pending" | "ready" | "error";
  error: string | null;
  created_at: string;
  brief: Brief | null;
  content: unknown;
};

export default function PrototypeBacklog() {
  const { token: legacyToken } = useParams();
  const { loading: authLoading, isAdmin, session } = useAdmin();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Бэклог прототипов";
    if (authLoading) return;
    if (!legacyToken && !session) return;
    if (!legacyToken && session && !isAdmin) return;

    (async () => {
      try {
        const data = await fetchPrototypeLogs(legacyToken);
        setRows(data.rows as Row[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка сети");
      }
    })();
  }, [authLoading, legacyToken, session, isAdmin]);

  if (!authLoading && !legacyToken && !session) {
    return <Navigate to="/auth?next=/prototype-backlog" replace />;
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

  if (!rows) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Загружаем…</p>
      </div>
    );
  }

  const ready = rows.filter((r) => r.status === "ready").length;
  const errored = rows.filter((r) => r.status === "error").length;
  const pending = rows.filter((r) => r.status === "pending").length;

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const b = r.brief;
    return (
      b?.niche?.toLowerCase().includes(q) ||
      b?.product?.toLowerCase().includes(q) ||
      b?.audience?.toLowerCase().includes(q) ||
      r.user_id?.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10">

        <header className="mb-8">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">Бэклог прототипов</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Всего: {rows.length} &nbsp;·&nbsp;
                <span className="text-money">✓ {ready} готово</span> &nbsp;·&nbsp;
                <span className="text-destructive">✗ {errored} ошибок</span>
                {pending > 0 && <> &nbsp;·&nbsp; <span className="text-yellow-400">⏳ {pending} в очереди</span></>}
              </p>
            </div>
            <Link
              to={`/backlog/${token}`}
              className="text-xs text-primary hover:underline"
            >
              ← Бэклог анализов
            </Link>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по нише, продукту, аудитории, user_id…"
            className="mt-4 w-full max-w-md rounded-lg border border-border bg-card/60 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </header>

        {/* Stats cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Всего", value: rows.length, color: "text-foreground" },
            { label: "Готово", value: ready, color: "text-money" },
            { label: "Ошибок", value: errored, color: "text-destructive" },
            { label: "CR", value: rows.length ? `${Math.round((ready / rows.length) * 100)}%` : "—", color: "text-primary" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={`text-2xl font-bold font-display ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Когда</th>
                <th className="px-4 py-3 font-semibold">Ниша</th>
                <th className="px-4 py-3 font-semibold">Продукт</th>
                <th className="px-4 py-3 font-semibold">Аудитория</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Формат</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    {search ? "Ничего не найдено" : "Пока прототипов нет"}
                  </td>
                </tr>
              )}
              {filtered.map((row) => {
                const b = row.brief;
                return (
                  <Fragment key={row.id}>
                    <tr className="border-t border-border/60 hover:bg-secondary/30">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                        {new Date(row.created_at).toLocaleString("ru-RU")}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="line-clamp-2 text-xs">{b?.niche || "—"}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="line-clamp-2 text-xs text-muted-foreground">{b?.product || "—"}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="line-clamp-2 text-xs text-muted-foreground">{b?.audience || "—"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {b?.format ? (
                          <span className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                            {b.format}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={
                          row.status === "ready"
                            ? "rounded-full bg-money/15 text-money px-2 py-0.5 text-xs font-medium"
                            : row.status === "error"
                            ? "rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-xs font-medium"
                            : "rounded-full bg-yellow-500/15 text-yellow-400 px-2 py-0.5 text-xs font-medium"
                        }>
                          {row.status === "ready" ? "готово" : row.status === "error" ? "ошибка" : "в очереди"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {row.status === "ready" && (
                          <Link
                            to={`/p/${row.id}`}
                            target="_blank"
                            className="mr-3 text-xs text-money hover:underline"
                          >
                            Открыть →
                          </Link>
                        )}
                        <button
                          onClick={() => setOpenId(openId === row.id ? null : row.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          {openId === row.id ? "Скрыть" : "Детали"}
                        </button>
                      </td>
                    </tr>
                    {openId === row.id && (
                      <tr className="border-t border-border/60 bg-background/40">
                        <td colSpan={7} className="px-4 py-4 space-y-4">

                          {/* Brief fields */}
                          {b && (
                            <div>
                              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Бриф
                              </div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                  ["Ниша", b.niche],
                                  ["Продукт", b.product],
                                  ["Аудитория", b.audience],
                                  ["Враг", b.enemy],
                                  ["Механизм", b.mechanism],
                                  ["Big Idea", b.bigidea],
                                  ["Гарантия", b.guarantee],
                                  ["Трафик", b.traffic],
                                  ["Формат", b.format],
                                ].filter(([, v]) => v).map(([label, value]) => (
                                  <div key={label as string} className="rounded-md border border-border/60 bg-secondary/20 p-3 text-xs">
                                    <div className="font-semibold text-muted-foreground mb-0.5">{label}</div>
                                    <div className="text-foreground/90">{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Error */}
                          {row.error && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                              <div className="font-semibold mb-1">Ошибка</div>
                              {row.error}
                            </div>
                          )}

                          {/* User ID */}
                          <div className="text-xs text-muted-foreground">
                            ID прототипа: <span className="font-mono text-foreground/60">{row.id}</span>
                            {row.user_id && (
                              <> &nbsp;·&nbsp; User: <span className="font-mono text-foreground/60">{row.user_id}</span></>
                            )}
                          </div>

                          {/* JSON */}
                          <details>
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              JSON контента прототипа
                            </summary>
                            <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-secondary/40 p-3 text-xs">
                              {JSON.stringify(row.content ?? row.error, null, 2)}
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
