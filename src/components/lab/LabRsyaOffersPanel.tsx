import { useMemo, useState } from "react";
import { Clipboard, Loader2, Megaphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { forgeApi } from "@/lib/forge/api";
import type {
  ForgeKnowledgeBase,
  ForgeProduct,
  ForgePrototype,
  ForgeRsyaOffer,
  ForgeRsyaOffersResult,
} from "@/lib/forge/types";

type Props = {
  product: ForgeProduct;
  kb: ForgeKnowledgeBase;
  prototypes: ForgePrototype[];
};

function formatOffer(offer: ForgeRsyaOffer, index: number): string {
  return [
    `#${index + 1} ${offer.angle}`,
    `Сегмент: ${offer.segment}`,
    `Заголовок: ${offer.title}`,
    `Текст: ${offer.text}`,
    `CTA: ${offer.cta}`,
    offer.image_brief ? `Креатив: ${offer.image_brief}` : "",
    offer.landing_hook ? `Посадочная: ${offer.landing_hook}` : "",
    offer.proof_or_limit ? `Доказательство/ограничение: ${offer.proof_or_limit}` : "",
    offer.compliance_note ? `Аккуратность: ${offer.compliance_note}` : "",
  ].filter(Boolean).join("\n");
}

async function copyText(text: string, success: string) {
  await navigator.clipboard.writeText(text);
  toast.success(success);
}

export function LabRsyaOffersPanel({ product, kb, prototypes }: Props) {
  const [directionSlug, setDirectionSlug] = useState<string | null>(null);
  const [prototypeId, setPrototypeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForgeRsyaOffersResult | null>(null);

  const directions = kb.directions ?? [];
  const selectedPrototype = useMemo(
    () => prototypes.find((p) => p.id === prototypeId) ?? null,
    [prototypeId, prototypes],
  );
  const directionTitle = useMemo(() => {
    if (!directionSlug) return "Общее";
    return directions.find((d) => d.slug === directionSlug)?.title ?? directionSlug;
  }, [directionSlug, directions]);

  function selectPrototype(id: string) {
    const next = prototypes.find((p) => p.id === id) ?? null;
    setPrototypeId(next?.id ?? null);
    if (next?.direction_slug) setDirectionSlug(next.direction_slug);
  }

  async function generate() {
    setLoading(true);
    try {
      const next = await forgeApi.generateRsyaOffers({
        product_id: product.id,
        direction_slug: directionSlug ?? undefined,
        prototype_id: prototypeId ?? undefined,
      });
      setResult(next);
      toast.success(`Готово: ${next.offers?.length ?? 0} офферов для РСЯ`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Не удалось сгенерировать офферы");
    } finally {
      setLoading(false);
    }
  }

  const allText = result?.offers?.map(formatOffer).join("\n\n---\n\n") ?? "";

  return (
    <div className="space-y-6 max-w-5xl">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Офферы для РСЯ Яндекс Директа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Генерирует короткие рекламные связки: сегмент, угол, заголовок, текст объявления,
            идея креатива и первый смысл посадочной. Лучше выбрать прототип — тогда офферы
            и креативы будут сделаны прямо под его первый экран и CTA.
          </p>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Тема / направление</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={!directionSlug ? "default" : "outline"}
                  onClick={() => setDirectionSlug(null)}
                >
                  Общее
                </Button>
                {directions.map((d) => (
                  <Button
                    key={d.slug}
                    type="button"
                    size="sm"
                    variant={directionSlug === d.slug ? "default" : "outline"}
                    onClick={() => setDirectionSlug(d.slug)}
                  >
                    {d.title}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Посадочная / прототип</p>
              <select
                value={prototypeId ?? ""}
                onChange={(e) => selectPrototype(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Без привязки — только по теме</option>
                {prototypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.template_id}{p.status === "published" ? " · published" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedPrototype ? (
            <Card className="border-border/70 bg-background/60">
              <CardContent className="py-3 text-xs text-muted-foreground">
                Офферы будут сделаны под прототип{" "}
                <span className="font-medium text-foreground">{selectedPrototype.name}</span>
                {selectedPrototype.slug ? (
                  <>
                    {" "}· <code>/lp/{selectedPrototype.slug}</code>
                  </>
                ) : null}
                . В `Посадочная` генератор укажет, какой экран/блок должен принимать этот креатив.
              </CardContent>
            </Card>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Направление: {directionTitle}</Badge>
            {selectedPrototype ? <Badge variant="secondary">Прототип: {selectedPrototype.name}</Badge> : null}
            <Badge variant="outline">KB: {kb.completion_percent}%</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Сгенерировать офферы
            </Button>
            {allText ? (
              <Button type="button" variant="outline" onClick={() => void copyText(allText, "Все офферы скопированы")}>
                <Clipboard className="h-4 w-4 mr-1" />
                Скопировать всё
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {result?.meta ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground grid gap-2 md:grid-cols-2">
            {result.meta.core_positioning ? (
              <p>
                <span className="text-foreground font-medium">Позиционирование: </span>
                {result.meta.core_positioning}
              </p>
            ) : null}
            {result.meta.target_action ? (
              <p>
                <span className="text-foreground font-medium">Целевое действие: </span>
                {result.meta.target_action}
              </p>
            ) : null}
            {result.meta.prototype_name || result.meta.landing_target ? (
              <p>
                <span className="text-foreground font-medium">Посадочная: </span>
                {result.meta.prototype_name ?? result.meta.landing_target}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {result?.offers?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.offers.map((offer, index) => (
            <Card key={`${offer.title}-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{offer.angle}</Badge>
                      <Badge variant="outline">{offer.segment}</Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">{offer.title}</CardTitle>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => void copyText(formatOffer(offer, index), "Оффер скопирован")}
                    aria-label="Скопировать оффер"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{offer.text}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant={offer.title.length <= 56 ? "outline" : "destructive"}>
                    Заголовок: {offer.title.length}/56
                  </Badge>
                  <Badge variant={offer.text.length <= 81 ? "outline" : "destructive"}>
                    Текст: {offer.text.length}/81
                  </Badge>
                  <Badge variant="outline">CTA: {offer.cta}</Badge>
                </div>
                {offer.image_brief ? (
                  <p>
                    <span className="font-medium">Креатив: </span>
                    {offer.image_brief}
                  </p>
                ) : null}
                {offer.landing_hook ? (
                  <p>
                    <span className="font-medium">Посадочная: </span>
                    {offer.landing_hook}
                  </p>
                ) : null}
                {offer.proof_or_limit ? (
                  <p>
                    <span className="font-medium">Доказательство/ограничение: </span>
                    {offer.proof_or_limit}
                  </p>
                ) : null}
                {offer.compliance_note ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Аккуратность: </span>
                    {offer.compliance_note}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Выберите направление и нажмите «Сгенерировать офферы».
          </CardContent>
        </Card>
      )}
    </div>
  );
}
