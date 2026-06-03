/**
 * Timeweb virtual hosting serves static files via nginx without try_files.
 * Direct URLs like /pricing 404 unless a physical path exists.
 * Copy root index.html into each static route folder so nginx can serve them.
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const indexPath = join(dist, "index.html");

const indexHtml = readFileSync(indexPath, "utf8");

/** Paths without dynamic segments (must match App.tsx static routes). */
const ADMIN_ROUTES = [
  "dashboard",
  "users",
  "idea-lab",
  "audits",
  "packages",
  "payments",
  "credits",
  "generations",
  "prompts",
  "logs",
  "settings",
  "templates",
  "lab",
  "lab/new",
];

const STATIC_ROUTES = [
  "site",
  "cabinet",
  "quiz",
  "idea-lab",
  "idea-lab/dashboard",
  "idea-lab/ideas/new",
  "idea-lab/session",
  "idea-lab/oferta",
  "idea-lab/privacy",
  "lab",
  "dashboard",
  "session",
  "ideas",
  "ideas/new",
  "projects",
  "audit",
  "growth-cycle",
  "auth",
  "admin",
  ...ADMIN_ROUTES.map((r) => `admin/${r}`),
  "backlog",
  "prototype-backlog",
  "builder",
  "prototype",
  "offer-generator",
  "my-prototypes",
  "pricing",
  "demo",
  "oferta",
  "privacy",
  "lp",
];

for (const route of STATIC_ROUTES) {
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), indexHtml);
}

// Hosts that map 404 → index.html (Cloudflare Pages, some CDNs)
writeFileSync(join(dist, "404.html"), indexHtml);

console.log(`[spa-fallback] wrote ${STATIC_ROUTES.length} route folders + 404.html`);
