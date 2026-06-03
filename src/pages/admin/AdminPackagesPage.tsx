import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminPackage } from "@/lib/admin/types.ext";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function AdminPackagesPage() {
  const legacyToken = useAdminLegacyToken();
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.packages
      .list(legacyToken)
      .then((r) =>
        setPackages(
          r.packages.map((p) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : JSON.parse(String(p.features ?? "[]")),
          })),
        ),
      )
      .finally(() => setLoading(false));
  }, [legacyToken]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {packages.map((pkg) => (
        <Card key={pkg.id} className={pkg.is_popular ? "border-primary ring-1 ring-primary/30" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              {pkg.badge_text && <Badge>{pkg.badge_text}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{pkg.subtitle}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-2xl font-bold">{pkg.price.toLocaleString("ru-RU")} ₽</p>
            <p>{pkg.credits_amount} генераций · {pkg.price_per_generation} ₽/шт</p>
            {pkg.savings_text && <p className="text-emerald-600">{pkg.savings_text}</p>}
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              {pkg.features.slice(0, 4).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-2">{pkg.button_text}</p>
            {!pkg.is_active && <Badge variant="secondary">Неактивен</Badge>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
