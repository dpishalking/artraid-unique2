import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  LEVEL_HINT_RU,
  LEVEL_TITLE_RU,
  calculateProjectMemoryCompletionPct,
  levelSlugFromCompletion,
} from "@/lib/projectMemory/completion";
import type { MemoryCompletionLevelSlug, MemoryCompetitor } from "@/lib/projectMemory/types";
import { getProjectMemoryRow, saveProjectMemorySection } from "@/lib/projectMemory/api";
import { mergeStoredMemoryIntoSections } from "@/lib/projectMemory/mergeSections";

const QS = [
  "Что вы продаёте?",
  "Кому продаёте?",
  "Какую главную проблему решаете?",
  "Какой результат обещаете?",
  "Какой у вас текущий оффер?",
  "Кто ваши 1–3 конкурента?",
  "Почему вам можно доверять?",
];

function parseCompetitorsBlock(text: string): MemoryCompetitor[] {
  const lines = text.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 10);
  return lines
    .map((line) => {
      const urlMatch = line.match(/https?:\/\/\S+/i);
      const url = urlMatch ? urlMatch[0] : "";
      const namePart = url ? line.replace(url, "").trim() : line.trim();
      return {
        name: namePart.slice(0, 120) || (url ? "Конкурент" : ""),
        url,
        notes: line,
      };
    })
    .filter((c) => c.name || c.url);
}

export default function ProjectMemoryQuickPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<string[]>(Array(QS.length).fill(""));
  const [summary, setSummary] = useState<{ pct: number; level: MemoryCompletionLevelSlug } | null>(
    null,
  );

  function setAns(i: number, v: string) {
    setAnswers((a) => a.map((x, idx) => (idx === i ? v : x)));
  }

  async function finish() {
    if (!projectId) return;
    setBusy(true);
    try {
      const comps = parseCompetitorsBlock(answers[5] ?? "");

      let rowDb = await getProjectMemoryRow(projectId);
      let snap = mergeStoredMemoryIntoSections(rowDb as unknown as Record<string, unknown>);
      rowDb = await saveProjectMemorySection(projectId, "product", {
        ...snap.product,
        product_description: answers[0] || snap.product.product_description || "",
      });
      snap = mergeStoredMemoryIntoSections(rowDb as unknown as Record<string, unknown>);

      rowDb = await saveProjectMemorySection(projectId, "audience", {
        ...snap.audience,
        target_audience: answers[1] || snap.audience.target_audience || "",
      });
      snap = mergeStoredMemoryIntoSections(rowDb as unknown as Record<string, unknown>);

      rowDb = await saveProjectMemorySection(projectId, "pains_desires", {
        ...snap.pains_desires,
        main_pain: answers[2] || snap.pains_desires.main_pain || "",
        main_desire: answers[3] || snap.pains_desires.main_desire || "",
      });
      snap = mergeStoredMemoryIntoSections(rowDb as unknown as Record<string, unknown>);

      rowDb = await saveProjectMemorySection(projectId, "offer_positioning", {
        ...snap.offer_positioning,
        current_offer: answers[4] || snap.offer_positioning.current_offer || "",
      });
      snap = mergeStoredMemoryIntoSections(rowDb as unknown as Record<string, unknown>);

      if (comps.length) {
        rowDb = await saveProjectMemorySection(projectId, "competitors", comps);
        snap = mergeStoredMemoryIntoSections(rowDb as unknown as Record<string, unknown>);
      }

      rowDb = await saveProjectMemorySection(projectId, "proofs", {
        ...snap.proofs,
        testimonials:
          `${answers[6] ?? ""}\n`.trim().length > 10 ? answers[6] : snap.proofs.testimonials || "",
      });
      snap = mergeStoredMemoryIntoSections(rowDb as unknown as Record<string, unknown>);

      const pct = calculateProjectMemoryCompletionPct(snap);
      setSummary({ pct, level: levelSlugFromCompletion(pct) });
      toast.success("Быстрое заполнение сохранено.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  if (!projectId) return null;

  if (summary) {
    const slug = summary.level;
    return (
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Результат</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              Сейчас память заполнена примерно на <strong>{summary.pct}%</strong>.
              <div className="mt-2 text-muted-foreground">
                <div className="font-medium text-foreground">{LEVEL_TITLE_RU[slug]}</div>
                <p>{LEVEL_HINT_RU[slug]}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link to={`/projects/${projectId}/memory`}>Полная память</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to={`/projects/${projectId}`}>Обзор проекта</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="text-xs uppercase text-muted-foreground">Быстрое заполнение</p>
        <h1 className="font-display text-2xl font-bold tracking-tight mt-1">7 ключевых вопросов</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Ответы заполнят ключевые поля памяти. Потом вы сможете углубиться в полную форму.
        </p>
      </div>

      <Card>
        <CardContent className="pt-8 space-y-4">
          <div className="text-sm font-medium">
            Шаг {step + 1} из {QS.length}
          </div>
          <div className="text-base">{QS[step]}</div>
          <Textarea
            value={answers[step]}
            onChange={(e) => setAns(step, e.target.value)}
            placeholder="Ответ здесь..."
            rows={5}
          />
          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Назад
            </Button>
            {step < QS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => Math.min(QS.length - 1, s + 1))}>
                Далее
              </Button>
            ) : (
              <Button type="button" disabled={busy} onClick={() => finish()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить и показать %"}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild className="px-0 text-muted-foreground">
            <Link to={`/projects/${projectId}/memory`}>Открыть полную память</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
