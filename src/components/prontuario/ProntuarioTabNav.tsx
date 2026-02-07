import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TabNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Mark as secondary tab - will be grouped in "Mais" menu */
  secondary?: boolean;
}

interface ProntuarioTabNavProps {
  items: TabNavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  criticalAlerts?: number;
  className?: string;
}

export function ProntuarioTabNav({
  items,
  activeTab,
  onTabChange,
  criticalAlerts = 0,
  className,
}: ProntuarioTabNavProps) {
  // Separate primary tabs (always visible) from secondary tabs (in "Mais" menu)
  const primaryItems = items.filter(item => !item.secondary);
  const secondaryItems = items.filter(item => item.secondary);

  // Check if active tab is in secondary items
  const activeInSecondary = secondaryItems.some(item => item.id === activeTab);
  const activeSecondaryItem = secondaryItems.find(item => item.id === activeTab);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  // Render a single tab button
  const renderTabButton = (item: TabNavItem, isActive: boolean) => {
    const Icon = item.icon;
    
    return (
      <button
        key={item.id}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${item.id}`}
        onClick={() => handleTabClick(item.id)}
        className={cn(
          // Base styles
          "flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Responsive sizing - compact on mobile, comfortable on desktop
          "min-h-[40px] px-2.5 py-2 md:min-h-[44px] md:px-4 md:py-2.5",
          // Text size - smaller on mobile
          "text-xs md:text-sm",
          // Active state
          isActive 
            ? "bg-primary text-primary-foreground shadow-md" 
            : "hover:bg-muted/80 text-muted-foreground hover:text-foreground active:bg-muted"
        )}
      >
        {Icon && <Icon className={cn(
          "h-4 w-4 flex-shrink-0",
          isActive ? "text-primary-foreground" : "text-muted-foreground"
        )} aria-hidden="true" />}
        <span className="hidden sm:inline">{item.label}</span>
        <span className="sm:hidden">{item.label.split(' ')[0]}</span>
        {item.badge && item.badge > 0 && (
          <Badge 
            variant={isActive ? "secondary" : (item.badgeVariant || "secondary")}
            className={cn(
              "text-[10px] px-1.5 h-5 min-w-[20px] flex-shrink-0",
              isActive && "bg-primary-foreground/20 text-primary-foreground"
            )}
          >
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <div className={cn(
      "w-full border-b bg-background sticky top-0 z-10",
      className
    )}>
      <nav 
        className="flex items-center gap-1 md:gap-2 py-2 px-2 md:px-4"
        role="tablist" 
        aria-label="Navegação do prontuário"
      >
        {/* Primary tabs - always visible */}
        {primaryItems.map((item) => {
          const isActive = activeTab === item.id;
          return renderTabButton(item, isActive);
        })}

        {/* "Mais" dropdown for secondary tabs */}
        {secondaryItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "min-h-[40px] px-2.5 py-2 md:min-h-[44px] md:px-4 md:py-2.5",
                  "text-xs md:text-sm",
                  activeInSecondary
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted/80 text-muted-foreground hover:text-foreground active:bg-muted"
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {activeInSecondary && activeSecondaryItem ? activeSecondaryItem.label : "Mais"}
                </span>
                <span className="sm:hidden">Mais</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-popover border border-border shadow-lg"
            >
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={cn(
                      "flex items-center gap-3 py-3 cursor-pointer",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {Icon && <Icon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge 
                        variant={item.badgeVariant || "secondary"}
                        className="text-[10px] px-1.5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </div>
  );
}
