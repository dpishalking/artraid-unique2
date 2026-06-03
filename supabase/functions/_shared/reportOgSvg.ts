import { escapeXml, type ReportShareMeta } from "./reportShareFetch.ts";

const W = 1200;
const H = 630;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/** OG-карточка 1200×630 для Telegram / Slack / VK. */
export function buildReportOgSvg(meta: ReportShareMeta): string {
  const host = escapeXml(truncate(meta.hostname, 42));
  const loss = escapeXml(truncate(meta.lossPercent, 24));
  const lever = meta.mainLever
    ? escapeXml(truncate(meta.mainLever, 90))
    : escapeXml(truncate(meta.mainProblem, 90));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0c10"/>
      <stop offset="55%" stop-color="#12141c"/>
      <stop offset="100%" stop-color="#0a0b0f"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="48"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="980" cy="80" rx="280" ry="200" fill="url(#glow)" filter="url(#blur)" opacity="0.9"/>
  <ellipse cx="180" cy="520" rx="240" ry="160" fill="#22c55e" opacity="0.08" filter="url(#blur)"/>

  <text x="72" y="88" fill="#71717a" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="22" font-weight="600" letter-spacing="3">AI-РАЗБОР · PISHALKING.RU</text>

  <text x="72" y="200" fill="#fafafa" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="56" font-weight="700">${host}</text>

  <text x="72" y="290" fill="#a1a1aa" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="36" font-weight="500">недополучает</text>
  <text x="72" y="380" fill="#f87171" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="96" font-weight="800">${loss}</text>
  <text x="72" y="430" fill="#a1a1aa" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="36" font-weight="500">выручки</text>

  <rect x="72" y="468" width="4" height="72" fill="#22c55e" opacity="0.85"/>
  <text x="92" y="502" fill="#22c55e" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="700" letter-spacing="2">ГЛАВНЫЙ РЫЧАГ</text>
  <text x="92" y="538" fill="#e4e4e7" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="26" font-weight="500">${lever}</text>
</svg>`;
}
