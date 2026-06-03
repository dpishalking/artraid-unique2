/**
 * Cron-friendly rescan: находит конкурентов с истёкшим scan_interval_days,
 * перезапускает analyze-competitor и создаёт alert при изменении page_snapshot_hash.
 *
 * Авторизация: заголовок x-cron-secret = CRON_SECRET (или вызов с service role из Supabase cron).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { writeAdminLog } from "../_shared/opsLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_PER_RUN = 5;

function authorize(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return true;
  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return serviceKey.length > 0 && auth === `Bearer ${serviceKey}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!authorize(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: dueRows, error: dueErr } = await admin
      .from("competitor_profiles")
      .select("id, project_id, host, name, last_scanned_at, scan_interval_days, latest_audit_id")
      .eq("status", "analyzed")
      .neq("is_self", true)
      .order("last_scanned_at", { ascending: true, nullsFirst: true })
      .limit(50);

    if (dueErr) throw dueErr;

    const now = Date.now();
    const due = (dueRows ?? []).filter((row) => {
      const intervalDays = Number(row.scan_interval_days) || 7;
      const last = row.last_scanned_at ? new Date(String(row.last_scanned_at)).getTime() : 0;
      return now - last >= intervalDays * 86400000;
    }).slice(0, MAX_PER_RUN);

    if (!due.length) {
      return new Response(JSON.stringify({ scanned: 0, message: "No competitors due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const oldHashes = new Map<string, string | null>();
    for (const row of due) {
      if (!row.latest_audit_id) continue;
      const { data: auditRow } = await admin
        .from("competitor_audits")
        .select("page_snapshot_hash")
        .eq("id", row.latest_audit_id)
        .maybeSingle();
      oldHashes.set(String(row.id), auditRow?.page_snapshot_hash ?? null);
    }

    const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-competitor`;
    const analyzeResp = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ competitor_ids: due.map((r) => r.id) }),
    });

    if (!analyzeResp.ok) {
      const t = await analyzeResp.text();
      throw new Error(`analyze-competitor failed: ${analyzeResp.status} ${t.slice(0, 200)}`);
    }

    const analyzeData = await analyzeResp.json();
    let alertsCreated = 0;

    for (const row of due) {
      const result = (analyzeData.results ?? []).find(
        (r: { competitor_id: string; ok: boolean }) => r.competitor_id === row.id,
      );
      if (!result?.ok) {
        await admin.from("competitor_change_alerts").insert({
          project_id: row.project_id,
          competitor_id: row.id,
          alert_type: "rescan_failed",
          message: `Не удалось пересканировать ${row.host}: ${result?.error ?? "unknown"}`,
        });
        alertsCreated++;
        continue;
      }

      const { data: profileAfter } = await admin
        .from("competitor_profiles")
        .select("latest_audit_id")
        .eq("id", row.id)
        .maybeSingle();

      const { data: newAudit } = profileAfter?.latest_audit_id
        ? await admin
          .from("competitor_audits")
          .select("page_snapshot_hash")
          .eq("id", profileAfter.latest_audit_id)
          .maybeSingle()
        : { data: null };

      const prev = oldHashes.get(String(row.id));
      const next = newAudit?.page_snapshot_hash ?? null;
      if (prev && next && prev !== next) {
        await admin.from("competitor_change_alerts").insert({
          project_id: row.project_id,
          competitor_id: row.id,
          alert_type: "page_changed",
          message: `Сайт ${row.host} изменился с прошлого скана — пересоберите карту ниши.`,
        });
        alertsCreated++;
      }
    }

    await writeAdminLog(admin, {
      type: "competitor.cron.rescan",
      message: `Rescanned ${due.length}, alerts ${alertsCreated}`,
      severity: "info",
      service: "scan-due-competitors",
      metadata: { count: due.length, alerts: alertsCreated },
    });

    return new Response(
      JSON.stringify({ scanned: due.length, alerts_created: alertsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("scan-due-competitors error:", msg);
    return new Response(JSON.stringify({ error: msg.slice(0, 300) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
