import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { escapeXml, fetchReportShareMeta, isValidShareId } from "../_shared/reportShareFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_ORIGIN = "https://pishalking.ru";

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id ?? null;
      } catch { /* ignore */ }
    }

    if (!isValidShareId(id)) {
      return new Response("Invalid id", { status: 400, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }

    const meta = await fetchReportShareMeta(id);
    if (!meta) {
      return new Response("Not found", { status: 404, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }

    const supabaseOrigin = Deno.env.get("SUPABASE_URL") ?? "";
    const ogImage = `${supabaseOrigin}/functions/v1/report-og?id=${encodeURIComponent(id)}`;
    const reportUrl = `${SITE_ORIGIN}/r/${id}`;
    const previewUrl = `${supabaseOrigin}/functions/v1/report-preview?id=${encodeURIComponent(id)}`;

    const title = `${meta.hostname} недополучает ${meta.lossPercent} выручки`;
    const description = truncate(meta.mainLever || meta.mainProblem, 200);

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeXml(title)}</title>
  <meta name="description" content="${escapeXml(description)}" />
  <link rel="canonical" href="${escapeXml(reportUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ru_RU" />
  <meta property="og:site_name" content="Pishalking — AI-разбор сайтов" />
  <meta property="og:url" content="${escapeXml(previewUrl)}" />
  <meta property="og:title" content="${escapeXml(title)}" />
  <meta property="og:description" content="${escapeXml(description)}" />
  <meta property="og:image" content="${escapeXml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeXml(title)}" />
  <meta name="twitter:description" content="${escapeXml(description)}" />
  <meta name="twitter:image" content="${escapeXml(ogImage)}" />
  <meta http-equiv="refresh" content="0;url=${escapeXml(reportUrl)}" />
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif; background: #0b0c10; color: #e4e4e7; }
    a { color: #22c55e; }
  </style>
</head>
<body>
  <p>Открываем отчёт… <a href="${escapeXml(reportUrl)}">Перейти вручную</a></p>
  <script>location.replace(${JSON.stringify(reportUrl)});</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (e) {
    console.error("report-preview error:", e);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
