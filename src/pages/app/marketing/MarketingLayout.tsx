import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Zap, Megaphone, History } from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/app/marketing", icon: LayoutDashboard, end: true },
  { label: "Templates", to: "/app/marketing/templates", icon: MessageSquare },
  { label: "Automações", to: "/app/marketing/automacoes", icon: Zap },
  { label: "Campanhas", to: "/app/marketing/campanhas", icon: Megaphone },
  { label: "Histórico", to: "/app/marketing/historico", icon: History },
];

export default function MarketingLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
        <p className="text-muted-foreground">CRM clínico, automações e campanhas</p>
      </div>

      <nav className="flex gap-1 border-b pb-0">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
