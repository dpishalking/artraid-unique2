import { useMemo, useState } from "react";
import { Save, Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { forgeApi } from "@/lib/forge/api";
import type {
  ForgeKbFabRow,
  ForgeKbObjection,
  ForgeKbPain,
  ForgeKbProof,
  ForgeKnowledgeBase,
} from "@/lib/forge/types";

type Props = {
  kb: ForgeKnowledgeBase;
  productId: string;
  onSaved: (next: ForgeKnowledgeBase) => void;
};

function calcCompletion(kb: ForgeKnowledgeBase): number {
  const sections = [
    Object.values(kb.product || {}).some(Boolean),
    Object.values(kb.audience || {}).some(Boolean),
    Boolean(kb.usp?.one_liner),
    (kb.pains?.length ?? 0) > 0,
    (kb.fab_matrix?.length ?? 0) > 0,
    (kb.objections?.length ?? 0) > 0,
    (kb.proofs?.length ?? 0) > 0,
    (kb.voc?.length ?? 0) > 0,
  ];
  const score = sections.filter(Boolean).length;
  return Math.round((score / sections.length) * 100);
}

export function LabKbEditor({ kb, productId, onSaved }: Props) {
  const [draft, setDraft] = useState<ForgeKnowledgeBase>(kb);
  const [saving, setSaving] = useState(false);

  const completion = useMemo(() => calcCompletion(draft), [draft]);

  function update<K extends keyof ForgeKnowledgeBase>(key: K, value: ForgeKnowledgeBase[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const next = await forgeApi.kb.upsert(productId, {
        product: draft.product,
        audience: draft.audience,
        usp: draft.usp,
        pains: draft.pains,
        voc: draft.voc,
        fab_matrix: draft.fab_matrix,
        objections: draft.objections,
        proofs: draft.proofs,
        tone: draft.tone,
        completion_percent: completion,
      });
      onSaved(next);
      toast.success("База знаний сохранена");
    } catch (e: any) {
      toast.error(e?.message ?? "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium">Заполнено: {completion}%</p>
          <p className="text-xs text-muted-foreground">
            Ручная правка после загрузки источников. Минимум для прототипа: продукт, аудитория, УТП, боли.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Сохранить
        </Button>
      </div>

      <Tabs defaultValue="product">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="product">Продукт</TabsTrigger>
          <TabsTrigger value="audience">Аудитория</TabsTrigger>
          <TabsTrigger value="usp">УТП</TabsTrigger>
          <TabsTrigger value="pains">Боли</TabsTrigger>
          <TabsTrigger value="fab">СДВ</TabsTrigger>
          <TabsTrigger value="objections">Возражения</TabsTrigger>
          <TabsTrigger value="proofs">Доказательства</TabsTrigger>
          <TabsTrigger value="voc">Голос клиента</TabsTrigger>
          <TabsTrigger value="tone">Тон</TabsTrigger>
        </TabsList>

        <TabsContent value="product" className="mt-4 space-y-3">
          <Field label="Категория" value={draft.product.category} onChange={(v) => update("product", { ...draft.product, category: v })} />
          <Field label="Что делает (механизм)" textarea value={draft.product.mechanism} onChange={(v) => update("product", { ...draft.product, mechanism: v })} />
          <Field label="Ценовой диапазон" value={draft.product.price_range} onChange={(v) => update("product", { ...draft.product, price_range: v })} />
          <Field label="Доставка / как получают" value={draft.product.delivery} onChange={(v) => update("product", { ...draft.product, delivery: v })} />
        </TabsContent>

        <TabsContent value="audience" className="mt-4 space-y-3">
          <Field label="Кто это? (одна фраза)" value={draft.audience.primary} onChange={(v) => update("audience", { ...draft.audience, primary: v })} />
          <Field label="Job to be done" textarea value={draft.audience.jobs_to_be_done} onChange={(v) => update("audience", { ...draft.audience, jobs_to_be_done: v })} />
          <Field
            label="Стадия осознанности (Hunt 1-5)"
            value={draft.audience.awareness_stage}
            placeholder="например: 2 — problem aware"
            onChange={(v) => update("audience", { ...draft.audience, awareness_stage: v })}
          />
          <StringList
            label="Сегменты"
            items={draft.audience.segments ?? []}
            onChange={(arr) => update("audience", { ...draft.audience, segments: arr })}
            placeholder="Сегмент (например: женщины 50+ с варикозом)"
          />
        </TabsContent>

        <TabsContent value="usp" className="mt-4 space-y-3">
          <Field label="УТП одной фразой" textarea value={draft.usp.one_liner} onChange={(v) => update("usp", { ...draft.usp, one_liner: v })} />
          <StringList
            label="Отстройка (3-5 пунктов)"
            items={draft.usp.differentiators ?? []}
            onChange={(arr) => update("usp", { ...draft.usp, differentiators: arr })}
            placeholder="Чем мы отличаемся"
          />
          <Field
            label="Альтернатива из категории"
            value={draft.usp.category_alternative}
            placeholder="С чем нас сравнят (мази, бинты, операция…)"
            onChange={(v) => update("usp", { ...draft.usp, category_alternative: v })}
          />
        </TabsContent>

        <TabsContent value="pains" className="mt-4">
          <PainsEditor items={draft.pains} onChange={(arr) => update("pains", arr)} />
        </TabsContent>

        <TabsContent value="fab" className="mt-4">
          <FabEditor items={draft.fab_matrix} onChange={(arr) => update("fab_matrix", arr)} />
        </TabsContent>

        <TabsContent value="objections" className="mt-4">
          <ObjectionsEditor items={draft.objections} onChange={(arr) => update("objections", arr)} />
        </TabsContent>

        <TabsContent value="proofs" className="mt-4">
          <ProofsEditor items={draft.proofs} onChange={(arr) => update("proofs", arr)} />
        </TabsContent>

        <TabsContent value="voc" className="mt-4">
          <StringList
            label="Цитаты целевой аудитории (как они говорят)"
            items={draft.voc}
            onChange={(arr) => update("voc", arr)}
            placeholder='"Боюсь, что снова будет больно после операции"'
            textarea
          />
        </TabsContent>

        <TabsContent value="tone" className="mt-4 space-y-3">
          <Field label="Тон голоса" textarea value={draft.tone.voice} onChange={(v) => update("tone", { ...draft.tone, voice: v })} />
          <StringList
            label="Стоп-слова"
            items={draft.tone.forbidden_words ?? []}
            onChange={(arr) => update("tone", { ...draft.tone, forbidden_words: arr })}
            placeholder="Слово, которое не использовать"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {textarea ? (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function StringList({
  label,
  items,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        {textarea ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            rows={2}
          />
        ) : (
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!draft.trim()) return;
            onChange([...items, draft.trim()]);
            setDraft("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-start justify-between gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
              <span className="whitespace-pre-wrap">{it}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PainsEditor({ items, onChange }: { items: ForgeKbPain[]; onChange: (v: ForgeKbPain[]) => void }) {
  const [text, setText] = useState("");
  const [weight, setWeight] = useState(3);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <Label className="text-xs text-muted-foreground">Добавить боль</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Описание боли" rows={2} />
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Вес 1-5:</Label>
          <Input type="number" min={1} max={5} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-20" />
          <Button
            variant="outline"
            onClick={() => {
              if (!text.trim()) return;
              onChange([...items, { text: text.trim(), weight }]);
              setText("");
              setWeight(3);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Добавить
          </Button>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((p, i) => (
          <li key={i} className="flex items-start justify-between gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
            <span>
              {p.text}
              {typeof p.weight === "number" && (
                <span className="ml-2 text-xs text-muted-foreground">вес {p.weight}</span>
              )}
            </span>
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FabEditor({ items, onChange }: { items: ForgeKbFabRow[]; onChange: (v: ForgeKbFabRow[]) => void }) {
  const [row, setRow] = useState<ForgeKbFabRow>({ feature: "", advantage: "", benefit: "" });
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <Label className="text-xs text-muted-foreground">Свойство → Действие → Выгода</Label>
        <Input placeholder="Свойство (что есть)" value={row.feature} onChange={(e) => setRow({ ...row, feature: e.target.value })} />
        <Input placeholder="Действие (что делает)" value={row.advantage} onChange={(e) => setRow({ ...row, advantage: e.target.value })} />
        <Input placeholder="Выгода (что получает клиент)" value={row.benefit} onChange={(e) => setRow({ ...row, benefit: e.target.value })} />
        <Button
          variant="outline"
          onClick={() => {
            if (!row.feature.trim() || !row.benefit.trim()) return;
            onChange([...items, row]);
            setRow({ feature: "", advantage: "", benefit: "" });
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Добавить строку
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((r, i) => (
          <li key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
            <span><b>С:</b> {r.feature}</span>
            <span><b>Д:</b> {r.advantage}</span>
            <span><b>В:</b> {r.benefit}</span>
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive justify-self-end">
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ObjectionsEditor({ items, onChange }: { items: ForgeKbObjection[]; onChange: (v: ForgeKbObjection[]) => void }) {
  const [row, setRow] = useState<ForgeKbObjection>({ text: "", answer: "" });
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <Textarea placeholder="Возражение" value={row.text} onChange={(e) => setRow({ ...row, text: e.target.value })} rows={2} />
        <Textarea placeholder="Ответ" value={row.answer} onChange={(e) => setRow({ ...row, answer: e.target.value })} rows={2} />
        <Button
          variant="outline"
          onClick={() => {
            if (!row.text.trim()) return;
            onChange([...items, row]);
            setRow({ text: "", answer: "" });
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Добавить
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((o, i) => (
          <li key={i} className="rounded-md bg-muted/60 px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <b>{o.text}</b>
              <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {o.answer && <div className="text-muted-foreground mt-1">{o.answer}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProofsEditor({ items, onChange }: { items: ForgeKbProof[]; onChange: (v: ForgeKbProof[]) => void }) {
  const [row, setRow] = useState<ForgeKbProof>({ type: "case", title: "", body: "" });
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <select
          value={row.type}
          onChange={(e) => setRow({ ...row, type: e.target.value as ForgeKbProof["type"] })}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="case">Кейс</option>
          <option value="metric">Цифра/метрика</option>
          <option value="screenshot">Скриншот</option>
          <option value="logo">Логотип</option>
          <option value="media">Упоминание в СМИ</option>
        </select>
        <Input placeholder="Заголовок" value={row.title} onChange={(e) => setRow({ ...row, title: e.target.value })} />
        <Textarea placeholder="Описание / цифра / контекст" value={row.body ?? ""} onChange={(e) => setRow({ ...row, body: e.target.value })} rows={2} />
        <Input placeholder="URL (опционально)" value={row.url ?? ""} onChange={(e) => setRow({ ...row, url: e.target.value })} />
        <Button
          variant="outline"
          onClick={() => {
            if (!row.title.trim()) return;
            onChange([...items, row]);
            setRow({ type: "case", title: "", body: "" });
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Добавить
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((p, i) => (
          <li key={i} className="rounded-md bg-muted/60 px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs text-muted-foreground uppercase">{p.type}</span>
                <div className="font-medium">{p.title}</div>
                {p.body && <div className="text-muted-foreground mt-0.5">{p.body}</div>}
              </div>
              <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
