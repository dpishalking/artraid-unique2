import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { forgeApi } from "@/lib/forge/api";
import type {
  ForgePrototype,
  ForgePrototypeContent,
  ForgeClipStepContent,
  ForgeClipMeta,
} from "@/lib/forge/types";
import { ClipStepRenderer } from "@/components/lp/ClipStepRenderer";
import { FullLandingRenderer } from "@/components/lp/FullLandingRenderer";
import type { FullLandingContent } from "@/components/lp/fullLandingTypes";

export default function LpPage() {
  const { slug, step: stepKey } = useParams<{ slug: string; step?: string }>();
  const [proto, setProto] = useState<ForgePrototype | null | undefined>(undefined);
  const [content, setContent] = useState<ForgePrototypeContent | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await forgeApi.prototypes.getBySlug(slug);
        if (cancelled) return;
        if (!p) {
          setProto(null);
          return;
        }
        setProto(p);
        const v = await forgeApi.prototypes.getActiveVersion(p.id);
        if (cancelled) return;
        setContent((v?.content ?? null) as ForgePrototypeContent | null);
      } catch {
        if (!cancelled) setProto(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (proto === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (proto === null) {
    return <Navigate to="/" replace />;
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Контент в подготовке
      </div>
    );
  }

  if (proto.template_id === "clip-4" && Array.isArray(content.steps)) {
    return (
      <ClipFunnelRoute
        prototypeId={proto.id}
        slug={proto.slug!}
        steps={content.steps}
        stepKey={stepKey}
        clipMeta={content.meta}
      />
    );
  }

  return (
    <FullLandingRenderer
      prototypeId={proto.id}
      content={content as FullLandingContent}
      mode="public"
    />
  );
}

function ClipFunnelRoute({
  prototypeId,
  slug,
  steps,
  stepKey,
  clipMeta,
}: {
  prototypeId: string;
  slug: string;
  steps: ForgeClipStepContent[];
  stepKey?: string;
  clipMeta?: ForgeClipMeta;
}) {
  const index = stepKey
    ? Math.max(0, steps.findIndex((s) => s.key === stepKey))
    : 0;
  const safeIndex = index === -1 ? 0 : index;
  const step = steps[safeIndex];
  const next = steps[safeIndex + 1];
  const nextHref = next ? `/lp/${slug}/${next.key}` : null;

  return (
    <ClipStepRenderer
      prototypeId={prototypeId}
      slug={slug}
      step={step}
      stepIndex={safeIndex}
      total={steps.length}
      nextHref={nextHref}
      clipMeta={clipMeta}
    />
  );
}
