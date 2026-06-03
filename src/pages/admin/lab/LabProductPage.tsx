import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { forgeApi } from "@/lib/forge/api";
import type { ForgeProduct, ForgePrototype, ForgeReview, ForgeKnowledgeBase } from "@/lib/forge/types";
import { LabKbEditor } from "@/components/lab/LabKbEditor";
import { LabReviewsPanel } from "@/components/lab/LabReviewsPanel";
import { LabPrototypesPanel } from "@/components/lab/LabPrototypesPanel";
import { LabSourcesPanel } from "@/components/lab/LabSourcesPanel";
import { LabRsyaOffersPanel } from "@/components/lab/LabRsyaOffersPanel";
import { LabGenerationPromptsPanel } from "@/components/lab/LabGenerationPromptsPanel";
import { LabStudioPortalPanel } from "@/components/lab/LabStudioPortalPanel";

const TABS = ["sources", "kb", "reviews", "prototypes", "rsya", "prompts", "studio"] as const;
type Tab = (typeof TABS)[number];

export default function LabProductPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "sources";

  const [product, setProduct] = useState<ForgeProduct | null>(null);
  const [kb, setKb] = useState<ForgeKnowledgeBase | null>(null);
  const [reviews, setReviews] = useState<ForgeReview[]>([]);
  const [prototypes, setPrototypes] = useState<ForgePrototype[]>([]);
  const [loading, setLoading] = useState(true);

  async function reloadReviews() {
    if (!id) return;
    const r = await forgeApi.reviews.list(id);
    setReviews(r);
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      forgeApi.products.get(id),
      forgeApi.kb.get(id),
      forgeApi.reviews.list(id),
      forgeApi.prototypes.listByProduct(id),
    ])
      .then(([p, k, r, pp]) => {
        setProduct(p);
        setKb(k ? { ...k, source_documents: k.source_documents ?? [], reference_sites: k.reference_sites ?? [], directions: k.directions ?? [] } : k);
        setReviews(r);
        setPrototypes(pp);
      })
      .catch((e) => toast.error(e?.message ?? "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!product || !kb) {
    return <p className="text-sm text-muted-foreground">Продукт не найден.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/lab"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Все продукты
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{product.slug}</code>
              <Badge variant="secondary">KB: {kb.completion_percent}%</Badge>
              <Badge variant="outline">Референсов: {kb.reference_sites?.length ?? 0}</Badge>
              <span>Прототипов: {prototypes.length}</span>
            </p>
          </div>
          <Button onClick={() => nav(`/admin/lab/products/${product.id}/new-prototype`)}>
            <Plus className="h-4 w-4 mr-1" /> Новый прототип
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <TabsList>
          <TabsTrigger value="sources">Источники</TabsTrigger>
          <TabsTrigger value="kb">База знаний</TabsTrigger>
          <TabsTrigger value="reviews">Отзывы ({reviews.length})</TabsTrigger>
          <TabsTrigger value="prototypes">Прототипы ({prototypes.length})</TabsTrigger>
          <TabsTrigger value="rsya">РСЯ офферы</TabsTrigger>
          <TabsTrigger value="prompts">Промпты</TabsTrigger>
          <TabsTrigger value="studio">Studio</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-6">
          <LabSourcesPanel
            product={product}
            kb={kb}
            onKbUpdated={setKb}
            onReviewsReload={reloadReviews}
            onGoKb={() => setParams({ tab: "kb" })}
            onCreatePrototype={() => nav(`/admin/lab/products/${product.id}/new-prototype`)}
          />
        </TabsContent>

        <TabsContent value="kb" className="mt-6">
          <LabKbEditor kb={kb} productId={product.id} onSaved={setKb} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <LabReviewsPanel productId={product.id} reviews={reviews} onChange={setReviews} />
        </TabsContent>

        <TabsContent value="prototypes" className="mt-6">
          <LabPrototypesPanel
            productId={product.id}
            prototypes={prototypes}
            onCreate={() => nav(`/admin/lab/products/${product.id}/new-prototype`)}
          />
        </TabsContent>

        <TabsContent value="rsya" className="mt-6">
          <LabRsyaOffersPanel product={product} kb={kb} prototypes={prototypes} />
        </TabsContent>

        <TabsContent value="prompts" className="mt-6">
          <LabGenerationPromptsPanel
            mode="product"
            productId={product.id}
            initialConfig={product.generation_prompts ?? {}}
            onSaved={(config) => setProduct((p) => (p ? { ...p, generation_prompts: config } : p))}
          />
        </TabsContent>

        <TabsContent value="studio" className="mt-6">
          <LabStudioPortalPanel productId={product.id} productName={product.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
