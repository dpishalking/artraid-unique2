import type { PositioningMapArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AWARENESS_LABELS: Record<string, string> = {
  unaware: "Unaware",
  problem: "Problem",
  solution: "Solution",
  product: "Product",
  most: "Most aware",
};

const AWARENESS_KEYS = ["unaware", "problem", "solution", "product", "most"] as const;

type Props = {
  data: PositioningMapArtifact;
};

/** SVG-карта: ось X — awareness, ось Y — sophistication (1–5). */
export function PositioningMap({ data }: Props) {
  const w = 520;
  const h = 320;
  const pad = { t: 24, r: 16, b: 40, l: 48 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const xForAwareness = (aw: string) => {
    const idx = AWARENESS_KEYS.indexOf(aw as (typeof AWARENESS_KEYS)[number]);
    const i = idx >= 0 ? idx : 2;
    return pad.l + (innerW * (i + 0.5)) / AWARENESS_KEYS.length;
  };
  const yForSoph = (soph: number) => {
    const s = Math.min(5, Math.max(1, soph));
    return pad.t + innerH - ((s - 1) / 4) * innerH;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Карта позиционирования ниши</CardTitle>
        <p className="text-xs text-muted-foreground">
          Schwartz Awareness × Sophistication. Звезда — вы, точки — конкуренты. Серые зоны — пустые
          сегменты рынка.
        </p>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-xl mx-auto" role="img">
          {/* grid */}
          {AWARENESS_KEYS.map((_, col) =>
            [1, 2, 3, 4, 5].map((soph) => {
              const cx = pad.l + (innerW * (col + 0.5)) / AWARENESS_KEYS.length;
              const cy = yForSoph(soph);
              const zoneKey = `${AWARENESS_KEYS[col]} × sophistication ${soph}`;
              const isEmpty = data.empty_zones?.some((z) => z.includes(AWARENESS_KEYS[col]) && z.includes(String(soph)));
              return (
                <rect
                  key={`${col}-${soph}`}
                  x={cx - innerW / AWARENESS_KEYS.length / 2 + 2}
                  y={cy - innerH / 5 / 2}
                  width={innerW / AWARENESS_KEYS.length - 4}
                  height={innerH / 5 - 2}
                  fill={isEmpty ? "hsl(var(--primary) / 0.06)" : "transparent"}
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  rx={4}
                />
              );
            }),
          )}

          {/* axes labels */}
          {AWARENESS_KEYS.map((aw, i) => (
            <text
              key={aw}
              x={pad.l + (innerW * (i + 0.5)) / AWARENESS_KEYS.length}
              y={h - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {AWARENESS_LABELS[aw]}
            </text>
          ))}
          {[1, 2, 3, 4, 5].map((s) => (
            <text
              key={s}
              x={pad.l - 8}
              y={yForSoph(s) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {s}
            </text>
          ))}

          {/* points */}
          {data.points.map((p) => {
            const cx = xForAwareness(p.awareness);
            const cy = yForSoph(p.sophistication);
            if (p.is_self) {
              return (
                <g key={p.competitor_id}>
                  <polygon
                    points={`${cx},${cy - 10} ${cx + 8},${cy + 6} ${cx - 8},${cy + 6}`}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth={1.5}
                  />
                  <title>{p.label} (вы)</title>
                </g>
              );
            }
            return (
              <g key={p.competitor_id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill="hsl(var(--muted-foreground) / 0.35)"
                  stroke="hsl(var(--foreground) / 0.5)"
                  strokeWidth={1}
                />
                <title>{p.label}</title>
              </g>
            );
          })}
        </svg>

        <div className="mt-3 flex flex-wrap gap-2">
          {data.points.map((p) => (
            <Badge
              key={p.competitor_id}
              variant={p.is_self ? "default" : "outline"}
              className="text-xs"
            >
              {p.is_self ? "★ " : ""}
              {p.label}
            </Badge>
          ))}
        </div>

        {data.empty_zones && data.empty_zones.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Пустые зоны: </span>
            {data.empty_zones.slice(0, 3).join(" · ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
