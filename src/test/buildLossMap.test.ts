import { describe, it, expect } from "vitest";
import { buildLossMap } from "@/lib/loss-map/buildLossMap";

describe("buildLossMap", () => {
  it("returns four categories summing to 100 and hostname from url", () => {
    const map = buildLossMap(
      {
        diagnosis: {
          metrics: [
            { name: "Понятность", score: 4, comment: "" },
            { name: "Ценность", score: 5, comment: "" },
            { name: "Доверие", score: 3, comment: "" },
            { name: "Действие", score: 6, comment: "" },
          ],
          mainProblem: "Слабый оффер",
          estimatedLossPercent: "30–40%",
        },
        problems: [],
        blocks: [],
      } as never,
      "https://example.com",
    );
    expect(map.hostname).toBe("example.com");
    expect(map.categories).toHaveLength(4);
    expect(map.categories.reduce((s, c) => s + c.percent, 0)).toBe(100);
  });
});
