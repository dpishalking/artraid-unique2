import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { forgeApi } from "@/lib/forge/api";
import type { ForgePrototype, ForgePrototypeContent } from "@/lib/forge/types";
import { LabPrototypePreview } from "@/components/lab/LabPrototypePreview";
import { LabLovableExportButton } from "@/components/lab/LabLovableExportButton";
import { studioPortalPath, publicLpPath } from "@/lib/forge/studioPaths";
import { SITE_ORIGIN } from "@/constants/site";

export default function StudioResultPage() {
  const { token = "", slug = "" } = useParams<{ token: string; slug: string }>();
  const [proto, setProto] = useState<ForgePrototype | null>(null);
  const [content, setContent] = useState<ForgePrototypeContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      forgeApi.prototypes.getBySlug(slug),
      forgeApi.prototypes.getBySlug(slug).then(async (p) => {
        if (!p) return null;
        return forgeApi.prototypes.getActiveVersion(p.id);
      }),
    ])
      .then(([p, v]) => {
        setProto(p);
        setContent((v?.content ?? null) as ForgePrototypeContent | null);
      })
      .catch((e) => toast.error(e?.message ?? "Не удалось загрузить"))
      .finally(() => setLoading(false));
  }, [slug]);

  const lpUrl = useMemo(() => `${SITE_ORIGIN}${publicLpPath(slug)}`, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proto || !content) {
    return <p className="text-muted-foreground text-center py-16">Прототип не найден</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={studioPortalPath(token)}
          className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Новая генерация
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">{proto.name}</h1>
        <p className="text-sm text-white/50 mt-1">Превью и экспорт в дизайн</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild className="border-white/15 bg-white/5">
          <a href={lpUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" /> Открыть лендинг
          </a>
        </Button>
        <LabLovableExportButton
          templateId={proto.template_id}
          content={content}
          prototypeName={proto.name}
        />
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden bg-white">
        <LabPrototypePreview
          templateId={proto.template_id}
          content={content}
          prototypeId={proto.id}
        />
      </div>
    </div>
  );
}
