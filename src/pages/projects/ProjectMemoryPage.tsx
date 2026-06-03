import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { MemoryFirstVisitBanner } from "@/components/projects/MemoryFirstVisitBanner";
import { MemoryImportPanel } from "@/components/projects/MemoryImportPanel";
import { MemoryUpdateSuggestions } from "@/components/projects/MemoryUpdateSuggestions";
import { listProjectFiles } from "@/lib/projectFiles/api";
import { getProjectById } from "@/lib/projects/projectApi";
import { getProjectMemoryRow, listPendingMemoryUpdates, saveProjectMemorySection } from "@/lib/projectMemory/api";
import {
  extractMemoryFromFiles,
  extractMemoryFromSite,
  getBriefImportAvailability,
  importMemoryFromBrief,
} from "@/lib/projectMemory/importMemory";
import { mergeStoredMemoryIntoSections } from "@/lib/projectMemory/mergeSections";
import type { MemoryCompletionLevelSlug, MemoryCompetitor, ObjectionEntry, ProjectMemorySections } from "@/lib/projectMemory/types";
import { MEMORY_SECTION_NAV, SECTION_FIELD_GROUPS, type MemoryFieldUi } from "@/lib/projectMemory/sectionsNav";
import {
  LEVEL_TITLE_RU,
  SECTION_MICRO_REWARD_RU,
  calculateProjectMemoryCompletionPct,
  levelSlugFromCompletion,
  sectionStatuses,
} from "@/lib/projectMemory/completion";

function setNested(
  draft: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  return { ...draft, [path]: value };
}

function LinesInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (lines: string[]) => void;
}) {
  const arr = Array.isArray(value) ? (value as string[]) : [];
  const text = arr.join("\n");
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Textarea
        value={text}
        onChange={(e) =>
          onChange(
            e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
          )
        }
        rows={Math.min(8, Math.max(3, text.split("\n").length || 3))}
        className="font-mono text-xs"
      />
    </label>
  );
}

function ScalarFieldEditor({
  f,
  data,
  onChange,
}: {
  f: MemoryFieldUi;
  data: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const raw = data[f.path];
  if (f.variant === "lines") {
    return (
      <LinesInput
        label={f.label}
        value={raw ?? []}
        onChange={(lines) => onChange(setNested(data, f.path, lines))}
      />
    );
  }
  if (f.variant === "area") {
    return (
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">{f.label}</span>
        <Textarea
          value={typeof raw === "string" ? raw : raw == null ? "" : String(raw)}
          onChange={(e) => onChange(setNested(data, f.path, e.target.value))}
          rows={4}
        />
      </label>
    );
  }
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{f.label}</span>
      <Input
        value={typeof raw === "string" ? raw : raw == null ? "" : String(raw)}
        onChange={(e) => onChange(setNested(data, f.path, e.target.value))}
      />
    </label>
  );
}

function CompetitorsEditor({
  rows,
  onChange,
}: {
  rows: MemoryCompetitor[];
  onChange: (r: MemoryCompetitor[]) => void;
}) {
  const list = rows.length ? rows : [{ name: "", url: "" }];
  const update = (i: number, patch: Partial<MemoryCompetitor>) => {
    const next = list.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  };

  return (
    <div className="space-y-3 text-sm">
      {list.slice(0, 14).map((row, i) => (
        <div key={i} className="grid md:grid-cols-3 gap-2 items-end border border-border/70 rounded-lg p-2">
          <label className="space-y-1">
            <span className="text-muted-foreground text-xs">Название конкурента</span>
            <Input value={row.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground text-xs">Сайт конкурента</span>
            <Input value={row.url ?? ""} onChange={(e) => update(i, { url: e.target.value })} />
          </label>
          <label className="space-y-1 md:col-span-1">
            <span className="text-muted-foreground text-xs">Заметки / позиционирование</span>
            <Input
              value={(row.notes ?? row.positioning ?? "") as string}
              onChange={(e) => update(i, { notes: e.target.value })}
            />
          </label>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { name: "", url: "" }])}>
        Добавить конкурента
      </Button>
    </div>
  );
}

function ObjectionsEditor({
  rows,
  onChange,
}: {
  rows: ObjectionEntry[];
  onChange: (r: ObjectionEntry[]) => void;
}) {
  const list = rows.length ? rows : [{ objection: "", answer: "", proof: "" }];
  const update = (i: number, patch: Partial<ObjectionEntry>) => {
    const next = list.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {list.slice(0, 14).map((row, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2 text-xs">
          <Input
            placeholder="Возражение"
            value={row.objection}
            onChange={(e) => update(i, { objection: e.target.value })}
          />
          <Textarea placeholder="Ответ" value={row.answer ?? ""} onChange={(e) => update(i, { answer: e.target.value })} rows={2} />
          <Textarea placeholder="Доказательство / цитата" value={row.proof ?? ""} onChange={(e) => update(i, { proof: e.target.value })} rows={2} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { objection: "" }])}>
        Добавить возражение
      </Button>
    </div>
  );
}

export default function ProjectMemoryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<string>("company");
  const [full, setFull] = useState<ProjectMemorySections | null>(null);
  const [completion, setCompletion] = useState(0);
  const [level, setLevel] = useState<MemoryCompletionLevelSlug | string>("empty");
  const [dirty, setDirty] = useState<Record<string, unknown>>({});
  const [competitorsDraft, setCompetitorsDraft] = useState<MemoryCompetitor[]>([]);
  const [objectionsDraft, setObjectionsDraft] = useState<ObjectionEntry[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [pendingSuggestions, setPendingSuggestions] = useState<Record<string, unknown>[]>([]);
  const [filesReadyCount, setFilesReadyCount] = useState(0);
  const [briefAvailable, setBriefAvailable] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  async function reloadPendingSuggestions() {
    if (!projectId) return;
    const rows = await listPendingMemoryUpdates(projectId);
    setPendingSuggestions(rows as Record<string, unknown>[]);
  }

  async function runQuickImport(
    action: () => Promise<{ created_count: number; message?: string }>,
  ) {
    if (!projectId || importBusy) return;
    setImportBusy(true);
    try {
      const result = await action();
      if (result.created_count > 0) {
        toast.success(`Найдено ${result.created_count} полей — проверьте и примените ниже`);
      } else {
        toast.message(result.message ?? "Новых полей для заполнения не найдено");
      }
      await reloadPendingSuggestions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось выполнить импорт");
    } finally {
      setImportBusy(false);
    }
  }

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProjectMemoryRow(projectId),
      getProjectById(projectId),
      listPendingMemoryUpdates(projectId),
      listProjectFiles(projectId).catch(() => []),
      getBriefImportAvailability(projectId).catch(() => ({ available: false, fieldCount: 0 })),
    ])
      .then(([raw, projectBundle, pending, files, briefInfo]) => {
        if (cancelled) return;
        const merged = mergeStoredMemoryIntoSections(raw as unknown as Record<string, unknown>);
        setFull(merged);
        setCompetitorsDraft(merged.competitors ?? []);
        setObjectionsDraft(merged.objections ?? []);
        const pct = calculateProjectMemoryCompletionPct(merged);
        setCompletion(pct);
        setLevel(levelSlugFromCompletion(pct));
        setWebsiteUrl(
          projectBundle?.project.current_website_url ??
            merged.websites?.main_website_url ??
            merged.company?.company_website ??
            null,
        );
        setPendingSuggestions(pending as Record<string, unknown>[]);
        setFilesReadyCount(files.filter((file) => file.extraction_status === "ready").length);
        setBriefAvailable(briefInfo.available);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setDirty({});
  }, [active, full]);

  useEffect(() => {
    if (!full) return;
    if (active === "competitors") setCompetitorsDraft(full.competitors ?? []);
    if (active === "objections") setObjectionsDraft(full.objections ?? []);
  }, [active, full]);

  const statuses = useMemo(() => (full ? sectionStatuses(full) : {}), [full]);

  const sectionDraft = useMemo(() => {
    if (!full) return {};
    const key = active as keyof ProjectMemorySections;
    const v = full[key];
    if (typeof v === "object" && v && !Array.isArray(v)) return { ...(v as Record<string, unknown>) };
    return {};
  }, [full, active]);

  const mergedObjectDraft = Object.keys(dirty).length ? { ...sectionDraft, ...dirty } : sectionDraft;

  async function reloadFromServer() {
    if (!projectId) return;
    const raw = await getProjectMemoryRow(projectId);
    const merged = mergeStoredMemoryIntoSections(raw as unknown as Record<string, unknown>);
    setFull(merged);
    const pct = calculateProjectMemoryCompletionPct(merged);
    setCompletion(pct);
    setLevel(levelSlugFromCompletion(pct));
  }

  async function handleSave() {
    if (!projectId || !full) return;
    setSaving(true);
    try {
      const sectionKey = active as keyof ProjectMemorySections;
      if (sectionKey === "competitors") {
        await saveProjectMemorySection(
          projectId,
          "competitors",
          competitorsDraft.filter((r) => (r.name ?? "").trim() || (r.url ?? "").trim()),
        );
      } else if (sectionKey === "objections") {
        await saveProjectMemorySection(
          projectId,
          "objections",
          objectionsDraft.filter((r) => (r.objection ?? "").trim()),
        );
      } else {
        await saveProjectMemorySection(
          projectId,
          sectionKey,
          mergedObjectDraft as ProjectMemorySections[typeof sectionKey],
        );
      }
      await reloadFromServer();
      toast.success(SECTION_MICRO_REWARD_RU[sectionKey as keyof typeof SECTION_MICRO_REWARD_RU] ?? "Секция сохранена.");
      setDirty({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  function statusBadge(id: keyof ProjectMemorySections) {
    const s = statuses[id];
    if (s === "full") return "заполнено";
    if (s === "partial") return "частично";
    return "пусто";
  }

  const activeMeta = MEMORY_SECTION_NAV.find((x) => x.id === active);
  const fields = (SECTION_FIELD_GROUPS[active] ?? []) as MemoryFieldUi[];

  const levelSlug = level in LEVEL_TITLE_RU ? (level as MemoryCompletionLevelSlug) : "empty";

  if (loading || !full) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-60 shrink-0 space-y-2">
        <div className="text-xs text-muted-foreground mb-2">Разделы</div>
        {MEMORY_SECTION_NAV.map((nav) => (
          <button
            key={nav.id}
            type="button"
            onClick={() => setActive(nav.id)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm border transition-colors ${
              nav.id === active ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
            }`}
          >
            <div className="font-medium">{nav.title}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{statusBadge(nav.id as keyof ProjectMemorySections)}</div>
          </button>
        ))}
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link to={`/projects/${projectId}/memory/quick`}>Быстрое заполнение</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to={`/projects/${projectId}`}>На обзор</Link>
        </Button>
      </aside>

      <div className="flex-1 space-y-4 min-w-0">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Память проекта</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Заполните данные один раз — сервис будет использовать их во всех анализах, офферах и прототипах.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Общая заполненность</span>
              <span>
                {completion}% · уровень: {LEVEL_TITLE_RU[levelSlug]}
              </span>
            </div>
            <Progress value={completion} />
            <div className="text-[11px] text-muted-foreground">
              Сервис запоминает ваш продукт, аудиторию, сайт, конкурентов и прошлые гипотезы. Чем больше блоков закрыто, тем точнее офферы
              и прототипы.
            </div>
          </CardContent>
        </Card>

        {projectId && (
          <MemoryFirstVisitBanner
            projectId={projectId}
            completion={completion}
            hasWebsite={Boolean(websiteUrl)}
            briefAvailable={briefAvailable}
            filesReadyCount={filesReadyCount}
            hasPendingSuggestions={pendingSuggestions.length > 0}
            onImportSite={() =>
              void runQuickImport(() => extractMemoryFromSite(projectId, websiteUrl ?? undefined))
            }
            onImportBrief={() => void runQuickImport(() => importMemoryFromBrief(projectId))}
            onImportFiles={() => void runQuickImport(() => extractMemoryFromFiles(projectId))}
            onOpenVoice={() => setVoiceOpen(true)}
          />
        )}

        {projectId && (
          <MemoryImportPanel
            projectId={projectId}
            defaultUrl={websiteUrl}
            filesReadyCount={filesReadyCount}
            briefAvailable={briefAvailable}
            voiceOpen={voiceOpen}
            onVoiceOpenChange={setVoiceOpen}
            onImported={() => void reloadPendingSuggestions()}
          />
        )}

        {projectId && pendingSuggestions.length > 0 && (
          <MemoryUpdateSuggestions
            suggestions={pendingSuggestions}
            projectId={projectId}
            onChanged={() => void reloadPendingSuggestions()}
            onApplied={({ completionPercent, level, snapshot }) => {
              setFull(snapshot);
              setCompletion(completionPercent);
              setLevel(level);
              setCompetitorsDraft(snapshot.competitors ?? []);
              setObjectionsDraft(snapshot.objections ?? []);
            }}
          />
        )}

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold">{activeMeta?.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">Сохраняется только этот блок.</p>
            </div>

            {active === "competitors" ? (
              <CompetitorsEditor rows={competitorsDraft} onChange={setCompetitorsDraft} />
            ) : active === "objections" ? (
              <ObjectionsEditor rows={objectionsDraft} onChange={setObjectionsDraft} />
            ) : (
              <div className="grid gap-4">
                {fields.map((f) => (
                  <ScalarFieldEditor
                    key={f.path}
                    f={f}
                    data={mergedObjectDraft}
                    onChange={(next) => setDirty(next)}
                  />
                ))}
              </div>
            )}

            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? "Сохраняем…" : "Сохранить раздел"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
