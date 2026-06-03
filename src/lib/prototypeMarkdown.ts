/** Full prototype → Markdown export (matches on-page content and block order). */

type Block = { note?: string; transition_hook?: string };

export type ScenarioSnapshot = {
  id: string;
  title: string;
  goal: string;
  logic: string;
  primaryCTA: string;
  landingStructure?: { id: string; title: string; goal: string }[];
};

export type PrototypeMarkdownContent = {
  meta: {
    project_name: string;
    tone_of_voice: string;
    target_action: string;
    awareness_stage?: string;
    sophistication_level?: number;
    voc_phrases?: string[];
    emotional_arc?: string;
    sequence?: string[];
    sequence_rationale?: string;
    scenario?: ScenarioSnapshot;
  };
  blocks: Record<string, unknown>;
};

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero · первый экран",
  paradigm_shift: "Миф и правда",
  pain: "Боль · контекст",
  enemy_section: "Враг · причина проблемы",
  solution: "Решение",
  transformation: "Трансформация · ДО и ПОСЛЕ",
  value: "Ценность · в цифрах",
  product: "Продукт · тарифы",
  process: "Процесс · как мы работаем",
  founder: "Основатель · почему мы",
  comparison: "Сравнение · мы vs остальные",
  social_proof: "Соц. доказательства",
  not_for: "Кому не подходит",
  objections: "Возражения · страхи и сомнения",
  faq: "FAQ · практические вопросы",
  future_pacing: "Future Pacing · жизнь после",
  guarantee: "Гарантия · снятие риска",
  final_cta: "Финальный CTA",
};

const ALL_VALID_KEYS = new Set([
  "hero", "paradigm_shift", "pain", "enemy_section", "solution",
  "transformation", "value", "product", "process", "founder",
  "comparison", "social_proof", "not_for", "objections",
  "faq", "future_pacing", "guarantee", "final_cta",
]);

function buildSequence(meta: PrototypeMarkdownContent["meta"]): string[] {
  const aiSeq = meta.sequence;
  const base = (aiSeq && aiSeq.length > 0 ? aiSeq : [...ALL_VALID_KEYS]).filter((k) =>
    ALL_VALID_KEYS.has(k),
  );
  const withoutHero = base.filter((k) => k !== "hero");
  const withoutCta = withoutHero.filter((k) => k !== "final_cta");
  return ["hero", ...withoutCta, "final_cta"];
}

function noteBlock(note?: string): string {
  if (!note?.trim()) return "";
  return `\n\n> **Заметка дизайнеру:** ${note.trim()}\n`;
}

function hookBlock(hook?: string): string {
  if (!hook?.trim()) return "";
  return `\n\n*Переход:* ${hook.trim()}\n`;
}

function bullets(items?: string[]): string {
  return (items ?? []).map((p) => `- ${p}`).join("\n");
}

function blockMarkdown(key: string, bl: Record<string, unknown>, index: number): string | null {
  const title = BLOCK_LABELS[key] ?? key;
  const head = `## ${String(index).padStart(2, "0")} · ${title}`;
  const note = noteBlock((bl as Block).note);
  const hook = hookBlock((bl as Block).transition_hook);

  switch (key) {
    case "hero": {
      const storyOpening = bl.story_opening as string | undefined;
      const parts: string[] = [head];
      if (storyOpening?.trim()) {
        parts.push("\n\n### История (открытие)\n\n" + storyOpening.trim());
        if (typeof bl.story_bridge === "string" && bl.story_bridge.trim()) {
          parts.push("\n\n" + bl.story_bridge.trim());
        }
      }
      parts.push(
        `\n\n**${bl.headline}**\n\n${bl.subheadline}\n\n**CTA:** ${bl.cta}\n\n${bullets(bl.trust as string[])}`,
      );
      const variants = bl.headline_variants as string[] | undefined;
      if (variants?.length) {
        const labels = ["Результат", "Боль", "Механизм"];
        parts.push(
          "\n\n### Варианты заголовка\n" +
            variants.map((v, i) => `${i + 1}. **${labels[i] ?? "Вариант"}:** ${v}`).join("\n"),
        );
      }
      return parts.join("") + note;
    }
    case "paradigm_shift":
      return `${head}\n\n**${bl.headline}**\n\n- *Миф:* ${bl.old_belief}\n- *Как на самом деле:* ${bl.new_belief}\n\n*Почему миф не работает:* ${bl.bridge}${hook}${note}`;
    case "pain":
      return `${head}\n\n### ${bl.title}\n${bl.intro ? `\n${bl.intro}\n` : ""}\n${bullets(bl.points as string[])}${hook}${note}`;
    case "enemy_section":
      return `${head}\n\n**${bl.headline}**\n\n**Враг:** ${bl.enemy_name}\n\n${bl.how_enemy_works}\n\n**Доказательство:** ${bl.proof}${hook}${note}`;
    case "solution": {
      const steps = (bl.steps as { title: string; desc: string }[]) ?? [];
      return `${head}\n\n### ${bl.title}\n${steps.map((s, i) => `${i + 1}. **${s.title}** — ${s.desc}`).join("\n")}${hook}${note}`;
    }
    case "transformation": {
      const before = (bl.before as string[]) ?? [];
      const after = (bl.after as string[]) ?? [];
      let s = `${head}\n\n### ${bl.headline}\n`;
      if (bl.timeline) s += `\n*За ${bl.timeline}*\n`;
      s += `\n**До:**\n${bullets(before)}\n\n**После:**\n${bullets(after)}${note}`;
      return s;
    }
    case "value": {
      const metrics = (bl.metrics as { number: string; label: string; loss_framing?: string; fascination?: string }[]) ?? [];
      return `${head}\n\n### ${bl.title}\n${metrics
        .map((m) => {
          let line = `- **${m.number}** ${m.label}`;
          if (m.fascination) line += `\n  *${m.fascination}*`;
          if (m.loss_framing) line += `\n  Без этого: ${m.loss_framing}`;
          return line;
        })
        .join("\n")}${note}`;
    }
    case "product": {
      const tiers = (bl.tiers as { name: string; price: string; description?: string; features: string[]; cta?: string }[]) ?? [];
      let s = `${head}\n\n### ${bl.title}\n`;
      if (bl.anchor_context) s += `\n${bl.anchor_context}\n`;
      s += tiers
        .map((t) => {
          let tier = `**${t.name}** — ${t.price}`;
          if (t.description) tier += `\n${t.description}`;
          tier += `\n${bullets(t.features)}`;
          if (t.cta) tier += `\nCTA: ${t.cta}`;
          return tier;
        })
        .join("\n\n");
      return s + note;
    }
    case "process": {
      const steps = (bl.steps as { title: string; desc: string; duration?: string }[]) ?? [];
      return `${head}\n\n### ${bl.title}\n${steps
        .map((s, i) => `${i + 1}. **${s.title}**${s.duration ? ` (${s.duration})` : ""} — ${s.desc}`)
        .join("\n")}${note}`;
    }
    case "founder": {
      const creds = (bl.credentials as string[]) ?? [];
      return `${head}\n\n**${bl.headline}**\n\n${bl.story}\n\n${bullets(creds)}\n\n**Почему мы:** ${bl.why_this}${hook}${note}`;
    }
    case "comparison": {
      const rows = (bl.rows as { feature: string; us: string; them: string }[]) ?? [];
      let s = `${head}\n\n### ${bl.title}\n`;
      if (bl.differentiation_angle) s += `\n${bl.differentiation_angle}\n`;
      s += `\n| | ${bl.us_label} | ${bl.them_label} |\n|---|---|---|\n`;
      s += rows.map((r) => `| ${r.feature} | ${r.us} | ${r.them} |`).join("\n");
      return s + note;
    }
    case "social_proof": {
      const items = (bl.items as { quote: string; author: string; role: string; result?: string; before_state?: string }[]) ?? [];
      return `${head}\n\n### ${bl.title}\n${items
        .map((i) => {
          let q = "";
          if (i.before_state) q += `*До: ${i.before_state}*\n\n`;
          q += `> «${i.quote}»\n> — **${i.author}**, ${i.role}${i.result ? ` · ${i.result}` : ""}`;
          return q;
        })
        .join("\n\n")}${note}`;
    }
    case "not_for":
      return `${head}\n\n### ${bl.title}\n${bl.intro ? `\n${bl.intro}\n` : ""}\n${bullets(bl.points as string[])}${note}`;
    case "objections": {
      const items = (bl.items as { objection?: string; answer?: string; q?: string; a?: string; frequency?: string; reframe?: string }[]) ?? [];
      return `${head}\n\n### ${bl.title}\n${items
        .map((it) => {
          const q = it.objection ?? it.q ?? "";
          const a = it.answer ?? it.a ?? "";
          let s = `**${q}**${it.frequency === "высокая" ? " *(частое)*" : ""}`;
          if (it.reframe) s += `\n*${it.reframe}*`;
          s += `\n\n${a}`;
          return s;
        })
        .join("\n\n")}${note}`;
    }
    case "faq": {
      const items = (bl.items as { q?: string; a?: string; objection?: string; answer?: string }[]) ?? [];
      return `${head}\n\n### ${bl.title}\n${items
        .map((it) => `**${it.q ?? it.objection ?? ""}**\n${it.a ?? it.answer ?? ""}`)
        .join("\n\n")}${note}`;
    }
    case "future_pacing":
      return `${head}\n\n**${bl.headline}**\n\n${bl.scene}\n\n*${bl.emotions}*\n\n_${bl.contrast}_${note}`;
    case "guarantee":
      return `${head}\n\n**${bl.headline}**\n\n- Тип: ${bl.type}\n- Срок: ${bl.duration}\n\n${bl.emotional_hook}\n\n**Условия:** ${bl.conditions}${note}`;
    case "final_cta": {
      let s = `${head}\n\n**${bl.headline}**\n\n${bl.subheadline}\n\n**CTA:** ${bl.cta}`;
      if (bl.urgency) s += `\n\n_${bl.urgency}_`;
      if (bl.risk_reversal) s += `\n\n✓ ${bl.risk_reversal}`;
      return s + note;
    }
    default:
      return null;
  }
}

export function buildPrototypeMarkdown(content: PrototypeMarkdownContent): string {
  const md: string[] = [];
  const { meta, blocks: b } = content;

  md.push(`# ${meta.project_name}`);
  md.push(`*${meta.tone_of_voice} · цель: ${meta.target_action}*\n`);

  if (meta.scenario) {
    md.push(
      `### Логика этого прототипа\n\n` +
        `- **Сценарий:** ${meta.scenario.title}\n` +
        `- **Цель:** ${meta.scenario.goal}\n` +
        `- **Логика:** ${meta.scenario.logic}\n` +
        `- **Основное действие:** ${meta.scenario.primaryCTA}\n`,
    );
    if (meta.scenario.landingStructure?.length) {
      md.push(
        `**Структура страницы:**\n${meta.scenario.landingStructure
          .map((b, i) => `${i + 1}. ${b.title}`)
          .join("\n")}\n`,
      );
    }
  }

  if (meta.sequence_rationale?.trim()) {
    md.push(`### Почему такая структура\n\n${meta.sequence_rationale.trim()}\n`);
  }
  if (meta.awareness_stage || meta.sophistication_level != null) {
    md.push(
      `**Стадия осознанности:** ${meta.awareness_stage ?? "—"}${meta.sophistication_level != null ? ` · Sophistication ${meta.sophistication_level}/5` : ""}\n`,
    );
  }
  if (meta.emotional_arc?.trim()) {
    md.push(`**Эмоциональная дуга:** ${meta.emotional_arc.trim()}\n`);
  }
  if (meta.voc_phrases?.length) {
    md.push(`### Голос клиента\n${meta.voc_phrases.map((p) => `- «${p}»`).join("\n")}\n`);
  }

  const sequence = buildSequence(meta);
  let sectionIndex = 0;
  for (const key of sequence) {
    const raw = b[key];
    if (!raw || typeof raw !== "object") continue;
    sectionIndex += 1;
    const section = blockMarkdown(key, raw as Record<string, unknown>, sectionIndex);
    if (section) md.push("\n" + section);
  }

  const micro = b.micro_copy as Record<string, string> | undefined;
  if (micro) {
    sectionIndex += 1;
    const lines = [
      `## ${String(sectionIndex).padStart(2, "0")} · Micro-copy`,
      `- Placeholder: «${micro.form_placeholder ?? ""}»`,
      `- Кнопка: «${micro.form_submit ?? ""}»`,
      `- После отправки: «${micro.form_success ?? ""}»`,
      `- Доверие: «${micro.trust_badge ?? ""}»`,
    ];
    if (micro.nav_cta) lines.push(`- CTA в навигации: «${micro.nav_cta}»`);
    if (micro.hero_badge) lines.push(`- Бейдж над заголовком: «${micro.hero_badge}»`);
    md.push("\n" + lines.join("\n"));
  }

  return md.join("\n").trim() + "\n";
}

export function downloadPrototypeMarkdown(content: PrototypeMarkdownContent, filename?: string): void {
  const text = buildPrototypeMarkdown(content);
  const safeName = (content.meta.project_name || "prototype")
    .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-_]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "prototype";
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `${safeName}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
