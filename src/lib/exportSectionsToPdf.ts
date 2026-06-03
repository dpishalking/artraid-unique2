/**
 * Собирает A4 PDF из DOM-узлов с атрибутом [data-pdf-section] внутри root.
 * Логика согласована с экспортом отчёта аудита (жёстко не режем секцию посередине).
 */
export async function exportSectionsToPdf(
  root: HTMLElement,
  filename: string,
  options?: { prepareDelayMs?: number },
): Promise<void> {
  const prepareDelayMs = options?.prepareDelayMs ?? 0;
  if (prepareDelayMs > 0) {
    await new Promise((r) => setTimeout(r, prepareDelayMs));
  }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  await new Promise((r) => setTimeout(r, 80));

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const PAGE_W = pdf.internal.pageSize.getWidth();
  const PAGE_H = pdf.internal.pageSize.getHeight();
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const MAX_H = PAGE_H - MARGIN * 2;
  const GAP = 6;
  const BG = "#ffffff";
  pdf.setFillColor(BG);
  pdf.rect(0, 0, PAGE_W, PAGE_H, "F");

  const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-section]"));
  if (sections.length === 0) {
    throw new Error("Нет секций для PDF (data-pdf-section).");
  }

  let cursorY = MARGIN;

  const renderImage = async (el: HTMLElement) => {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: BG,
      windowWidth: el.scrollWidth,
    });
    const ratio = canvas.height / canvas.width;
    return {
      data: canvas.toDataURL("image/jpeg", 0.92),
      ratio,
      h: CONTENT_W * ratio,
    };
  };

  const addNewPage = () => {
    pdf.addPage();
    pdf.setFillColor(BG);
    pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
    cursorY = MARGIN;
  };

  for (const section of sections) {
    const { data, h, ratio } = await renderImage(section);
    if (h > MAX_H) {
      if (cursorY > MARGIN) addNewPage();
      const fitH = MAX_H;
      const fitW = fitH / ratio;
      const offsetX = MARGIN + (CONTENT_W - fitW) / 2;
      pdf.addImage(data, "JPEG", offsetX, MARGIN, fitW, fitH);
      cursorY = MARGIN + fitH + GAP;
    } else {
      if (cursorY + h > PAGE_H - MARGIN) addNewPage();
      pdf.addImage(data, "JPEG", MARGIN, cursorY, CONTENT_W, h);
      cursorY += h + GAP;
    }
  }

  pdf.save(filename);
}

export function sanitizePdfFilenameBase(name: string, maxLen = 48): string {
  const t = name
    .trim()
    .slice(0, maxLen)
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return t || "prototip";
}
