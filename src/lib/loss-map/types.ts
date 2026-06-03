export type LossMapCategoryId = "offer" | "trust" | "form" | "speed";

export type LossMapCategory = {
  id: LossMapCategoryId;
  label: string;
  percent: number;
  hint: string;
};

export type LossMapData = {
  hostname: string;
  totalLossLabel: string;
  headline: string;
  categories: LossMapCategory[];
  topFixes: string[];
};
