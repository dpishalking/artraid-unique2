const SITE_ORIGIN = "https://pishalking.ru";

/** Страница отчёта на фронте (SPA). */
export function reportPagePath(shareId: string): string {
  return `/r/${shareId}`;
}

export function reportPageUrl(shareId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN;
  return `${origin}${reportPagePath(shareId)}`;
}

/** HTML с OG-тегами + редирект на отчёт — для шаринга в Telegram/Slack. */
export function reportPreviewUrl(shareId: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) return reportPageUrl(shareId);
  return `${base}/functions/v1/report-preview?id=${encodeURIComponent(shareId)}`;
}

/** SVG 1200×630 для og:image. */
export function reportOgImageUrl(shareId: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) return "";
  return `${base}/functions/v1/report-og?id=${encodeURIComponent(shareId)}`;
}
