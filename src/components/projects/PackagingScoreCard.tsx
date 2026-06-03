import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PackagingScoreCard({ score }: { score: number | null }) {
  const display = score ?? null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Зрелость упаковки</CardTitle>
      </CardHeader>
      <CardContent>
        {display === null ? (
          <p className="text-sm text-muted-foreground">
            Недостаточно данных. После построения карты появится оценка.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <span className="font-display text-4xl font-bold text-primary">{display}</span>
            <span className="text-muted-foreground pb-1">/ 100</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Оценка упаковки: контекст проекта и последний аудит сайта.
        </p>
      </CardContent>
    </Card>
  );
}
