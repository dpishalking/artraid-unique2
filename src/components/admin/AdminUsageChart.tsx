import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminDaily } from "@/lib/admin/types";

type Props = {
  daily: AdminDaily;
};

export function AdminUsageChart({ daily }: Props) {
  const data = daily.labels.map((label, i) => ({
    date: label.slice(5),
    audits: daily.audits[i] ?? 0,
    prototypes: daily.prototypes[i] ?? 0,
    signups: daily.signups[i] ?? 0,
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="auditsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="protoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(160 60% 45%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(160 60% 45%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(220 70% 55%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(220 70% 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area
            type="monotone"
            dataKey="audits"
            name="Аудиты"
            stroke="hsl(var(--primary))"
            fill="url(#auditsFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="prototypes"
            name="Прототипы"
            stroke="hsl(160 60% 45%)"
            fill="url(#protoFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="signups"
            name="Регистрации"
            stroke="hsl(220 70% 55%)"
            fill="url(#signupFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
