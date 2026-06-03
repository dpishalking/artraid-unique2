/**
 * Builder /prototype — same dark design system as the rest of the site.
 * Cards use bg-card + primary borders; slightly elevated tiles for readability.
 */

export const builderPage =
  "flex min-h-0 flex-1 flex-col bg-background text-foreground relative overflow-hidden";

export const builderHeader =
  "sticky top-0 z-30 border-b border-primary/10 bg-background/80 backdrop-blur-xl";

export const builderWorkspace =
  "relative rounded-3xl border border-primary/30 bg-card text-card-foreground shadow-[0_12px_48px_-16px_hsl(var(--primary)/0.35)] ring-1 ring-primary/10";

export const builderWorkspacePadding = "p-6 md:p-8";

export const builderMuted = "text-muted-foreground";

export const builderBody = "text-foreground/85";

export const builderHeading = "font-display font-bold tracking-tight text-foreground";

export const builderStepLabel = "text-xs font-semibold uppercase tracking-wider text-primary";

export const builderTile =
  "rounded-2xl border-2 border-border bg-secondary/50 text-left transition-all hover:border-primary/45 hover:bg-secondary/80";

export const builderTileSelected =
  "border-primary bg-primary/15 shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.4)] ring-1 ring-primary/25";

export const builderInput =
  "rounded-2xl border-2 border-border bg-background/60 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export const builderSubpanel = "rounded-2xl border border-primary/20 bg-secondary/30";

export const builderAiIsland = "rounded-2xl border border-primary/30 bg-primary/5";

export const builderPremiumCard = `${builderWorkspace} ${builderWorkspacePadding}`;

export const builderCardGlow =
  "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-money opacity-[0.1] blur-3xl";

export const builderBodyText = builderBody;

export const builderMutedText = builderMuted;

export const builderScenarioTile = builderTile;

export const builderScenarioTileSelected = builderTileSelected;

export const builderInputClass = builderInput;
