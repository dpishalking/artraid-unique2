import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import type { NextBestAction } from "@/lib/projects/getNextBestAction";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NextBestActionCard({ action }: { action: NextBestAction }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Следующий шаг
          </div>
          <p className="font-display font-semibold text-lg">{action.title}</p>
          <p className="text-sm text-muted-foreground max-w-xl">{action.description}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link to={action.ctaTo}>
            {action.ctaLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
