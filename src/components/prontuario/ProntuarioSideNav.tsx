import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X, type LucideIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

export interface SideNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface ProntuarioSideNavProps {
  items: SideNavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function ProntuarioSideNav({
  items,
  activeTab,
  onTabChange,
  className,
}: ProntuarioSideNavProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setDrawerOpen(false);
  };

  const activeItem = items.find((item) => item.id === activeTab);

  const renderNavItem = (item: SideNavItem, compact = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${item.id}`}
        onClick={() => handleTabClick(item.id)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-lg text-left transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "px-2.5 py-2 text-xs" : "px-3 py-2.5 text-sm",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "flex-shrink-0",
              compact ? "h-3.5 w-3.5" : "h-4 w-4",
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        )}
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <Badge
            variant={isActive ? "secondary" : (item.badgeVariant || "destructive")}
            className={cn(
              "text-[10px] px-1.5 h-4 min-w-[18px]",
              isActive && "bg-primary-foreground/20 text-primary-foreground"
            )}
          >
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  // ─── MOBILE: Floating button + Drawer ────────────
  if (isMobile) {
    return (
      <>
        {/* Floating menu button */}
        <Button
          variant="default"
          size="sm"
          className="fixed bottom-20 left-3 z-40 h-10 shadow-lg gap-1.5 rounded-full px-3"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="h-4 w-4" />
          <span className="text-xs max-w-[100px] truncate">{activeItem?.label || "Menu"}</span>
        </Button>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b pb-3">
              <DrawerTitle className="text-base">Navegação do Prontuário</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="flex-1 px-3 py-2">
              <nav className="flex flex-col gap-0.5" role="tablist" aria-label="Navegação do prontuário">
                {items.map((item) => renderNavItem(item))}
              </nav>
            </ScrollArea>
            <div className="p-3 border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full" size="sm">
                  Fechar
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // ─── DESKTOP / TABLET: Vertical sidebar ──────────
  return (
    <aside
      className={cn(
        "w-56 flex-shrink-0 border-r bg-muted/30",
        className
      )}
    >
      <ScrollArea className="h-full">
        <nav
          className="flex flex-col gap-0.5 p-2"
          role="tablist"
          aria-label="Navegação do prontuário"
        >
          {items.map((item) => renderNavItem(item, true))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
