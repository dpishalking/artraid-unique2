import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "./CopyButton";
import type { OfferResult } from "@/lib/offer-generator/types";

type Props = { result: OfferResult };

function TextBlock({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-background/30 p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <CopyButton text={value} />
      </div>
      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export function OfferFormatTabs({ result }: Props) {
  const fv = result.formatVersions;
  const hasAny = fv.landing || fv.post || fv.ad || fv.stories || fv.email;
  if (!hasAny) return null;

  const defaultTab = fv.landing ? "landing" : fv.post ? "post" : fv.ad ? "ad" : fv.stories ? "stories" : "email";

  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4">Версии под форматы</h2>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/80 p-1 w-full justify-start">
          {fv.landing && <TabsTrigger value="landing">Лендинг</TabsTrigger>}
          {fv.post && <TabsTrigger value="post">Пост</TabsTrigger>}
          {fv.ad && <TabsTrigger value="ad">Реклама</TabsTrigger>}
          {fv.stories && <TabsTrigger value="stories">Сторис</TabsTrigger>}
          {fv.email && <TabsTrigger value="email">Email</TabsTrigger>}
        </TabsList>

        {fv.landing && (
          <TabsContent value="landing" className="mt-4 space-y-3">
            <TextBlock label="Заголовок" value={fv.landing.headline} />
            <TextBlock label="Подзаголовок" value={fv.landing.subheadline} />
            <TextBlock label="CTA" value={fv.landing.cta} />
            <TextBlock label="Микротекст" value={fv.landing.microcopy} />
          </TabsContent>
        )}
        {fv.post && (
          <TabsContent value="post" className="mt-4 space-y-3">
            <TextBlock label="Хук" value={fv.post.hook} />
            <TextBlock label="Текст" value={fv.post.body} />
            <TextBlock label="CTA" value={fv.post.cta} />
          </TabsContent>
        )}
        {fv.ad && (
          <TabsContent value="ad" className="mt-4 space-y-3">
            <TextBlock label="Основной текст" value={fv.ad.primaryText} />
            <TextBlock label="Заголовок" value={fv.ad.headline} />
            <TextBlock label="Описание" value={fv.ad.description} />
            <TextBlock label="CTA" value={fv.ad.cta} />
          </TabsContent>
        )}
        {fv.stories && (
          <TabsContent value="stories" className="mt-4 space-y-3">
            <TextBlock label="Слайд 1" value={fv.stories.slide1} />
            <TextBlock label="Слайд 2" value={fv.stories.slide2} />
            <TextBlock label="Слайд 3" value={fv.stories.slide3} />
            <TextBlock label="Слайд 4" value={fv.stories.slide4} />
          </TabsContent>
        )}
        {fv.email && (
          <TabsContent value="email" className="mt-4 space-y-3">
            <TextBlock label="Тема" value={fv.email.subject} />
            <TextBlock label="Превью" value={fv.email.preview} />
            <TextBlock label="Начало" value={fv.email.opening} />
            <TextBlock label="CTA" value={fv.email.cta} />
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}
