import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminIdeaLabSessionDetail, AdminIdeaLabSessionRow } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { AdminIdeaLabClarityPreview } from "@/components/admin/AdminIdeaLabClarityPreview";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clarityLabel } from "@/lib/ideaLab/clarity";
import { IDEA_LAB_STAGES } from "@/lib/ideaLab/stages";
import { parseIdeaLabState } from "@/lib/ideaLab/state";
import type { IdeaLabMessage } from "@/lib/ideaLab/types";
import { cn } from "@/lib/utils";

function startupModeLabel(mode: string): string {
  if (mode === "has_idea") return "Есть идея";
  if (mode === "find_idea" || mode === "unclear") return "Ищет идею";
  return mode;
}

function stageTitle(id: string): string {
  return IDEA_LAB_STAGES.find((s) => s.id === id)?.title ?? id;
}

function previewText(row: AdminIdeaLabSessionRow): string {
  const p = row.card_preview;
  return p.primary_offer || p.short_description || p.idea_name || p.target_audience || row.last_user_message || "—";
}

export default function AdminIdeaLabPage() {
  const legacyToken = useAdminLegacyToken();
  const [rows, setRows] = useState<AdminIdeaLabSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [startupMode, setStartupMode] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminIdeaLabSessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.ideaLab
      .list(
        {
          q: q || undefined,
          startup_mode: startupMode || undefined,
          limit: 300,
        },
        legacyToken,
      )
      .then((r) => setRows(r.sessions))
      .finally(() => setLoading(false));
  };

  useEffect(load, [legacyToken]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    adminApi.ideaLab
      .get(selectedId, legacyToken)
      .then((r) => setDetail(r.session))
      .finally(() => setDetailLoading(false));
  }, [selectedId, legacyToken]);

  const labState = detail ? parseIdeaLabState(detail.idea_lab_state) : null;
  const messages = labState?.messages ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Idea Lab</h1>
        <p className="text-sm text-muted-foreground">
          Сессии пользователей: карточка ясности и последние сообщения диалога
        </p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <Input
          placeholder="Email, имя, текст карточки…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={startupMode}
          onChange={(e) => setStartupMode(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Все режимы</option>
          <option value="find_idea">Ищет идею</option>
          <option value="has_idea">Есть идея</option>
        </select>
        <Button type="submit" variant="secondary">
          Найти
        </Button>
      </form>

      <AdminTableShell
        loading={loading}
        rows={rows}
        empty="Сессий Idea Lab пока нет"
        onRowClick={(r) => setSelectedId(r.project_id)}
        columns={[
          {
            key: "updated",
            header: "Обновлено",
            render: (r) => new Date(r.updated_at).toLocaleString("ru-RU"),
          },
          {
            key: "user",
            header: "Пользователь",
            render: (r) => (
              <div className="min-w-[140px]">
                <div className="truncate">{r.email ?? r.display_name ?? r.user_id.slice(0, 8)}</div>
                {r.profile_source === "idea_lab_register" && (
                  <div className="text-[10px] uppercase tracking-wide text-amber-600">Idea Lab reg</div>
                )}
              </div>
            ),
          },
          {
            key: "mode",
            header: "Режим",
            render: (r) => startupModeLabel(r.startup_mode),
          },
          {
            key: "clarity",
            header: "Ясность",
            render: (r) => (
              <div>
                <div className="font-medium">{r.clarity_percent}%</div>
                <div className="text-[11px] text-muted-foreground">{clarityLabel(r.clarity_percent)}</div>
              </div>
            ),
          },
          {
            key: "stage",
            header: "Этап",
            render: (r) => stageTitle(r.stage),
          },
          {
            key: "msgs",
            header: "Диалог",
            render: (r) => `${r.user_messages} / ${r.total_messages}`,
          },
          {
            key: "preview",
            header: "Карточка / последнее",
            render: (r) => (
              <span className="line-clamp-2 max-w-md text-sm text-muted-foreground" title={previewText(r)}>
                {previewText(r)}
              </span>
            ),
          },
        ]}
      />

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {detailLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!detailLoading && detail && labState && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.project_name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                  <span>{new Date(detail.updated_at).toLocaleString("ru-RU")}</span>
                  <span>{startupModeLabel(detail.startup_mode)}</span>
                  <span>{stageTitle(detail.stage)}</span>
                  <span className="font-medium text-foreground">{detail.clarity_percent}% ясности</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {detail.email && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/admin/users/${detail.user_id}`}>Профиль пользователя</Link>
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section>
                    <h3 className="mb-2 font-semibold">Карточка ясности</h3>
                    <AdminIdeaLabClarityPreview card={labState.card} />
                  </section>

                  <section>
                    <h3 className="mb-2 font-semibold">Диалог ({messages.length})</h3>
                    <div className="max-h-[min(52vh,520px)] space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/10 p-3">
                      {messages.length === 0 && (
                        <p className="py-8 text-center text-muted-foreground">Сообщений пока нет</p>
                      )}
                      {messages.map((msg: IdeaLabMessage, index) => (
                        <div
                          key={`${index}-${msg.role}`}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm leading-relaxed",
                            msg.role === "user"
                              ? "ml-4 bg-primary/10 text-foreground"
                              : "mr-4 border border-border/60 bg-card",
                          )}
                        >
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {msg.role === "user" ? "Пользователь" : "Наставник"}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.coach?.insight && (
                            <p className="mt-2 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                              Insight: {msg.coach.insight}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
