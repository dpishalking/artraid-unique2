export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_STORED_TEXT_CHARS = 100_000;

/** Должна совпадать с pdfjs-dist в package.json — worker с CDN, не из /assets (Timeweb ломает .mjs). */
const PDFJS_VERSION = "4.10.38";
const PDFJS_WORKER_SRC = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export type ExtractOutcome =
  | { status: "ready"; text: string }
  | { status: "skipped"; note: string }
  | { status: "failed"; error: string };

let pdfWorkerReady = false;

function truncateStored(s: string): string {
  if (s.length <= MAX_STORED_TEXT_CHARS) return s;
  return `${s.slice(0, MAX_STORED_TEXT_CHARS)}\n… [текст обрезан при сохранении — загрузите фрагмент отдельно при необходимости]`;
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

/** Узнаваем MIME по имени файла (часть браузеров отдаёт пустой type). */
export function resolveMime(filename: string, declared: string): string {
  if (declared && declared !== "") return declared;
  const e = ext(filename);
  if (e === ".pdf") return "application/pdf";
  if (e === ".txt") return "text/plain";
  if (e === ".md" || e === ".markdown") return "text/markdown";
  if (e === ".json") return "application/json";
  if (e === ".csv") return "text/csv";
  if (e === ".html" || e === ".htm") return "text/html";
  if (e === ".xml") return "text/xml";
  if (e === ".rtf") return "application/rtf";
  return "application/octet-stream";
}

function stripHtml(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  } catch {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

async function readAsUtf8(file: File): Promise<string> {
  return file.text();
}

async function extractPdfText(file: File): Promise<{ ok: string } | { err: string }> {
  try {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfWorkerReady) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      pdfWorkerReady = true;
    }

    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const maxExtractChars = 80_000;
    const chunks: string[] = [];
    let total = 0;
    const numPages = doc.numPages;
    for (let p = 1; p <= numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      let line = "";
      for (const item of content.items) {
        if (item && typeof item === "object" && "str" in item) {
          line += String((item as { str: string }).str);
        }
      }
      const piece = line.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
      if (piece) chunks.push(`[Стр. ${p}]\n${piece}`);
      total = chunks.join("\n\n").length;
      if (total >= maxExtractChars) break;
    }
    const merged = truncateStored(chunks.join("\n\n").slice(0, maxExtractChars));
    if (!merged.trim()) return { err: "В PDF не найден текст (возможно, только картинки или сканы)." };
    return { ok: merged };
  } catch (e) {
    return { err: e instanceof Error ? e.message : "Не удалось прочитать PDF" };
  }
}

/** Извлекает текст в браузере; бинарные форматы без парсера — skipped. */
export async function extractTextFromFile(filename: string, declaredMime: string, file: File): Promise<ExtractOutcome> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { status: "failed", error: `Файл больше ${MAX_UPLOAD_BYTES / (1024 * 1024)} МБ.` };
  }

  const mime = resolveMime(filename, declaredMime);
  const e = ext(filename);

  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml" ||
    mime === "application/rtf"
  ) {
    try {
      let raw = await readAsUtf8(file);
      if (mime === "text/html") raw = stripHtml(raw);
      const t = truncateStored(raw.replace(/\u0000/g, "").trim());
      if (!t) return { status: "skipped", note: "Пустой текстовый файл." };
      return { status: "ready", text: t };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "Не удалось прочитать текстовый файл" };
    }
  }

  if (mime === "application/pdf" || e === ".pdf") {
    const r = await extractPdfText(file);
    return "ok" in r ? { status: "ready", text: r.ok } : { status: "failed", error: r.err };
  }

  if (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/")
  ) {
    return {
      status: "skipped",
      note: `Файл сохранён; тип «${mime}» без автоматического текста — кратко опишите содержание в разделе «Память проекта».`,
    };
  }

  if (
    e === ".docx" ||
    e === ".pptx" ||
    e === ".xlsx" ||
    mime.includes("wordprocessingml") ||
    mime.includes("spreadsheetml") ||
    mime.includes("presentationml")
  ) {
    return {
      status: "skipped",
      note: "Файл сохранён. DOCX/XLSX/PPTX: экспортируйте текст в .txt или PDF с текстовым слоем.",
    };
  }

  return {
    status: "skipped",
    note:
      mime === "application/octet-stream"
        ? "Файл сохранён; текст не распознан — при необходимости загрузите .txt / PDF с текстом."
        : `Файл сохранён; тип «${mime}» без извлечения текста в браузере.`,
  };
}
