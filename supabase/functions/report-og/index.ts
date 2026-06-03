import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildReportOgSvg } from "../_shared/reportOgSvg.ts";
import { fetchReportShareMeta, isValidShareId } from "../_shared/reportShareFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return new Response("Invalid id", { status: 400, headers: corsHeaders });
    }

    const meta = await fetchReportShareMeta(id);
    if (!meta) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const svg = buildReportOgSvg(meta);
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (e) {
    console.error("report-og error:", e);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
