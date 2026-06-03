import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  geminiFlashModel,
  geminiJsonResponse,
  requireGeminiKey,
} from "../_shared/gemini.ts";
import { fetchSiteText, normalizeSiteUrl } from "../_shared/fetchSiteText.ts";
import {
  MEMORY_SITE_EXTRACT_SCHEMA,
  buildMemoryExtractPrompt,
  buildMemoryExtractPromptFromText,
  buildMemoryUpdateRowsFromExtract,
  flattenMemoryExtract,
} from "../_shared/memorySiteExtract.ts";
import { normalizeMemoryRowSections } from "../_shared/projectMemoryAiBlock.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ImportSource = "site" | "files" | "voice";

function pickWebsite(project: Record<string, unknown>, memory: Record<string, unknown>, override?: string): string {
  const fromBody = override?.trim();
  if (fromBody) return normalizeSiteUrl(fromBody);

  const fromProject = typeof project.current_website_url === "string" ? project.current_website_url.trim() : "";
  if (fromProject) return normalizeSiteUrl(fromProject);

  const websites = memory.websites;
  if (websites && typeof websites === "object" && !Array.isArray(websites)) {
    const main = (websites as Record<string, unknown>).main_website_url;
    if (typeof main === "string" && main.trim()) return normalizeSiteUrl(main.trim());
  }

  const company = memory.company;
  if (company && typeof company === "object" && !Array.isArray(company)) {
    const site = (company as Record<string, unknown>).company_website;
    if (typeof site === "string" && site.trim()) return normalizeSiteUrl(site.trim());
  }

  return "";
}

function projectCardFromRow(project: Record<string, unknown>) {
  return {
    name: project.name,
    product_name: project.product_name,
    product_description: project.product_description,
    target_audience: project.target_audience,
    main_goal: project.main_goal,
    current_website_url: project.current_website_url,
  };
}

async function verifyProjectAccess(
  admin: ReturnType<typeof createClient>,
  projectId: string,
  token: string | undefined,
) {
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !anon || token === anon) return;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return;
  const { data: owned } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) throw new Error("Forbidden");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    requireGeminiKey();
    const body = await req.json().catch(() => ({}));
    const projectId = String(body.project_id ?? "");
    const source = (String(body.source ?? "site") as ImportSource);
    const urlOverride = typeof body.url === "string" ? body.url : undefined;
    const voiceText = typeof body.text === "string" ? body.text.trim() : "";

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    try {
      await verifyProjectAccess(admin, projectId, token);
    } catch {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: memoryRow } = await admin
      .from("project_memories")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    const mergedMemory = normalizeMemoryRowSections((memoryRow ?? {}) as Record<string, unknown>);
    const projectCard = projectCardFromRow(project as Record<string, unknown>);

    let sourceLabel = "";
    let sourceId = "";
    let sourceType = "site_import";
    let materialText = "";
    let siteUrl = "";

    if (source === "site") {
      siteUrl = pickWebsite(project as Record<string, unknown>, mergedMemory as Record<string, unknown>, urlOverride);
      if (!siteUrl) {
        return new Response(JSON.stringify({ error: "Укажите URL сайта" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        materialText = await fetchSiteText(siteUrl);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось загрузить сайт";
        return new Response(JSON.stringify({ error: message }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sourceLabel = `Сайт ${siteUrl}`;
      sourceId = new URL(siteUrl).hostname;
      sourceType = "site_import";
    } else if (source === "files") {
      const { data: files, error: filesError } = await admin
        .from("project_files")
        .select("id,original_filename,extracted_text,extraction_status")
        .eq("project_id", projectId)
        .eq("extraction_status", "ready")
        .order("created_at", { ascending: false })
        .limit(12);

      if (filesError) throw filesError;

      const chunks = (files ?? [])
        .map((file) => {
          const name = String(file.original_filename ?? "file");
          const text = typeof file.extracted_text === "string" ? file.extracted_text.trim() : "";
          return text ? `### ${name}\n${text}` : "";
        })
        .filter(Boolean);

      materialText = chunks.join("\n\n").slice(0, 48_000);
      if (materialText.trim().length < 120) {
        return new Response(
          JSON.stringify({
            error: "Нет файлов с извлечённым текстом. Загрузите PDF или документ в раздел «Файлы проекта».",
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      sourceLabel = `Загруженные файлы (${chunks.length})`;
      sourceId = `files_${chunks.length}`;
      sourceType = "file_import";
    } else if (source === "voice") {
      if (voiceText.length < 80) {
        return new Response(JSON.stringify({ error: "Расскажите чуть подробнее — минимум 2–3 предложения" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      materialText = voiceText.slice(0, 12_000);
      sourceLabel = "Голосовой рассказ о проекте";
      sourceId = "voice_dump";
      sourceType = "voice_import";
    } else {
      return new Response(JSON.stringify({ error: "Unknown source" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (materialText.trim().length < 120) {
      return new Response(JSON.stringify({ error: "Слишком мало текста для анализа" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt =
      source === "site"
        ? buildMemoryExtractPrompt(siteUrl, materialText, projectCard)
        : buildMemoryExtractPromptFromText(sourceLabel, materialText, projectCard);

    const extractedRaw = await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction: prompt,
      userParts: [{ text: "Извлеки память проекта в JSON по схеме." }],
      responseSchema: MEMORY_SITE_EXTRACT_SCHEMA,
      temperature: 0.25,
      maxOutputTokens: 8192,
    });

    const flat = flattenMemoryExtract(extractedRaw);
    if (source === "site" && siteUrl) {
      flat.push(
        { section: "company", field: "company_website", value: siteUrl },
        { section: "websites", field: "main_website_url", value: siteUrl },
      );
    }

    const updateRows = buildMemoryUpdateRowsFromExtract(
      projectId,
      sourceId,
      flat,
      mergedMemory as Record<string, unknown>,
      { fillEmptyOnly: true, sourceType },
    );

    if (!updateRows.length) {
      return new Response(
        JSON.stringify({
          ok: true,
          created_count: 0,
          extracted_count: flat.length,
          source,
          message: "Новых пустых полей для заполнения не найдено — память уже содержит эти данные.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await admin
      .from("project_memory_updates")
      .delete()
      .eq("project_id", projectId)
      .eq("source_type", sourceType)
      .eq("status", "pending");

    const { error: insertError } = await admin.from("project_memory_updates").insert(updateRows);
    if (insertError) throw insertError;

    const eventTitles: Record<ImportSource, string> = {
      site: "Импорт памяти с сайта",
      files: "Импорт памяти из файлов",
      voice: "Импорт памяти из рассказа",
    };

    await admin.from("project_events").insert({
      project_id: projectId,
      user_id: project.user_id,
      event_type: "project_memory_import",
      title: eventTitles[source],
      description: `AI предложил ${updateRows.length} полей (${sourceLabel})`,
      metadata: { source, source_id: sourceId, created_count: updateRows.length },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        created_count: updateRows.length,
        extracted_count: flat.length,
        source,
        source_label: sourceLabel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("extract-project-memory error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
