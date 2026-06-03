import { useEffect } from "react";
import type { Audit } from "@/components/AuditDashboard";
import { reportOgImageUrl } from "./reportShareUrls";

function hostnameLabel(siteUrl?: string): string {
  if (!siteUrl) return "Сайт";
  try {
    return new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`).hostname.replace(/^www\./, "");
  } catch {
    return siteUrl;
  }
}

function setMeta(property: string, content: string, isName = false) {
  const attr = isName ? "name" : "property";
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Обновляет title и OG в <head> при открытии отчёта (вкладка + часть клиентов). */
export function useReportPageMeta(audit: Audit | null, siteUrl?: string, shareId?: string | null) {
  useEffect(() => {
    if (!audit) return;

    const host = hostnameLabel(siteUrl);
    const loss = audit.diagnosis.estimatedLossPercent || "—";
    const title = `${host} недополучает ${loss} выручки`;
    const description = (audit.diagnosis.mainLever || audit.diagnosis.mainProblem || "").slice(0, 200);

    document.title = title;
    setMeta("description", description, true);
    setMeta("og:title", title);
    setMeta("og:description", description);
    if (shareId) {
      const ogImage = reportOgImageUrl(shareId);
      if (ogImage) setMeta("og:image", ogImage);
    }

    return () => {
      document.title = "Где сайт теряет деньги — экспресс-аудит за 60 секунд";
    };
  }, [audit, siteUrl, shareId]);
}
