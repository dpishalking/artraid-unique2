import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Coins,
  Sparkles,
  FileText,
  ScrollText,
  Settings,
  Layers,
  Search,
  FlaskConical,
  Lightbulb,
} from "lucide-react";

export const ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/idea-lab", label: "Idea Lab", icon: Lightbulb },
  { to: "/admin/audits", label: "Audits", icon: Search },
  { to: "/admin/lab", label: "Лаборатория", icon: FlaskConical },
  { to: "/admin/packages", label: "Packages", icon: Package },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/credits", label: "Credits", icon: Coins },
  { to: "/admin/generations", label: "Generations", icon: Sparkles },
  { to: "/admin/prompts", label: "Prompts", icon: FileText },
  { to: "/admin/templates", label: "Templates", icon: Layers, disabled: true },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as { to: string; label: string; icon: typeof LayoutDashboard; disabled?: boolean }[];

export function adminTitle(pathname: string): string {
  const item = ADMIN_NAV.find((n) => pathname.startsWith(n.to));
  return item?.label ?? "Admin";
}
