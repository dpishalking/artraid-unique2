import type { VoiceOverlapArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { data: VoiceOverlapArtifact };

function WordList({ title, words, tone }: { title: string; words: string[]; tone?: "emerald" | "amber" | "muted" }) {
  if (!words.length) return null;
  const border =
    tone === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-border/60 bg-muted/20";
  return (
    <div className={`rounded-lg border p-3 ${border}`}>
      <p className="text-xs font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{words.join(" · ")}</p>
    </div>
  );
}

export function VoiceOverlap({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Voice Overlap</CardTitle>
        <p className="text-xs text-muted-foreground">Пересечение языка рынка и вашего позиционирования</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <WordList title="Общий язык с нишей" words={data.shared} />
        <WordList title="Можно позаимствовать" words={data.stealable} tone="emerald" />
        <WordList title="Только у вас (USP)" words={data.unique_to_you} tone="emerald" />
        <WordList title="Cliché рынка" words={data.cliche} tone="amber" />
      </CardContent>
    </Card>
  );
}
