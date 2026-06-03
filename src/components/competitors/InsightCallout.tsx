/** Однострочный вывод над виджетом — без цветового шума. */
type Props = {
  verdict: string;
  children: React.ReactNode;
};

export function InsightCallout({ verdict, children }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">{verdict}</p>
      {children}
    </div>
  );
}
