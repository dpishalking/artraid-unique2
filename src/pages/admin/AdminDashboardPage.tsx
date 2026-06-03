import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminDashboardV2 } from "@/lib/admin/types.ext";
import { MetricCard } from "@/components/admin/MetricCard";
import { AdminUsageChart } from "@/components/admin/AdminUsageChart";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDaily } from "@/lib/admin/types";

function fmtRub(n: number) {
  return `${n.toLocaleString("ru-RU")} ₽`;
}

export default function AdminDashboardPage() {
  const legacyToken = useAdminLegacyToken();
  const [data, setData] = useState<AdminDashboardV2 | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.dashboard(legacyToken).then(setData).catch((e) => setError(e.message));
  }, [legacyToken]);

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error}. Проверьте вход под admin-email и что <code>get-admin-dashboard</code> доступна в Supabase.
      </p>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { finance, users, generations, packages: pkg, latest, daily } = data;
  const chartDaily: AdminDaily = {
    labels: daily.labels,
    audits: daily.prototypes,
    prototypes: daily.prototypes,
    signups: daily.signups,
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Финансы</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Выручка сегодня" value={fmtRub(finance.revenue_today)} />
          <MetricCard title="Выручка 7 дней" value={fmtRub(finance.revenue_7d)} />
          <MetricCard title="Всего оплат" value={finance.payments_count} />
          <MetricCard title="Средний чек" value={fmtRub(finance.average_check)} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Пользователи и генерации</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Всего пользователей" value={users.total} />
          <MetricCard title="Новых за 7 дней" value={users.new_7d} />
          <MetricCard title="С кредитами" value={users.with_credits} />
          <MetricCard title="Без кредитов" value={users.without_credits} />
          <MetricCard title="Платящих" value={users.paying} />
          <MetricCard title="Прототипов всего" value={generations.total} />
          <MetricCard title="Сегодня" value={generations.today} />
          <MetricCard title="Баланс кредитов (сумма)" value={generations.credits_balance_total} />
        </div>
      </section>

      <Card className="p-4">
        <AdminUsageChart daily={chartDaily} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Последние пользователи</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {latest.users.map((u) => (
              <Link key={u.user_id} to={`/admin/users/${u.user_id}`} className="flex justify-between hover:text-primary">
                <span className="truncate">{u.email ?? u.user_id.slice(0, 8)}</span>
                <span className="text-muted-foreground">{(u as { balance?: number }).balance ?? u.credits_balance} кр.</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Нулевой баланс</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {latest.zero_credit_users.length === 0 && (
              <p className="text-muted-foreground">Нет пользователей с 0 кредитов</p>
            )}
            {latest.zero_credit_users.map((u) => (
              <Link key={u.user_id} to={`/admin/users/${u.user_id}`} className="block truncate hover:text-primary">
                {u.email}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Продажи пакетов</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          {Object.entries(pkg.sales).map(([id, count]) => (
            <span key={id}>
              <strong>{id}</strong>: {count}
            </span>
          ))}
          {Object.keys(pkg.sales).length === 0 && (
            <span className="text-muted-foreground">Пока нет оплат — создайте payment и отметьте paid в Payments</span>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <Link to="/backlog" className="hover:text-foreground">Backlog аудитов →</Link>
        <Link to="/prototype-backlog" className="hover:text-foreground">Backlog прототипов →</Link>
      </div>
    </div>
  );
}
