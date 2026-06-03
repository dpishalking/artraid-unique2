type Props = {
  current: number;
  total: number;
  /** Короткая подпись текущего шага (тон / название блока брифа) */
  stepLabel?: string;
};

export function OfferProgress({ current, total, stepLabel }: Props) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>Прогресс брифа</span>
          {stepLabel ? (
            <span className="truncate font-normal text-primary/85">{stepLabel}</span>
          ) : null}
        </div>
        <span className="tabular-nums text-primary shrink-0">
          {current} / {total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-money transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
