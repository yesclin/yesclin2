import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

export interface TabNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Mark as secondary tab - will be grouped in "More" menu on mobile */
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
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // On mobile: ALL tabs are shown with horizontal scroll
  // The "More" menu is ONLY used when explicitly requested via secondary flag
  // and even then, secondary tabs remain accessible via Visão Geral hub
  const primaryItems = isMobile ? items.filter(item => !item.secondary) : items;
  const secondaryItems = isMobile ? items.filter(item => item.secondary) : [];

  // Check if active tab is in secondary items (need to show in "More" menu)
  const activeInSecondary = secondaryItems.some(item => item.id === activeTab);

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = activeTabRef.current;
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        
        // Check if active tab is outside visible area with proper margins
        const leftMargin = showLeftFade ? 48 : 16;
        const rightMargin = showRightFade ? 48 : 16;
        
        if (activeRect.left < containerRect.left + leftMargin) {
          container.scrollTo({
            left: container.scrollLeft - (containerRect.left - activeRect.left + leftMargin),
            behavior: 'smooth'
          });
        } else if (activeRect.right > containerRect.right - rightMargin) {
          container.scrollTo({
            left: container.scrollLeft + (activeRect.right - containerRect.right + rightMargin),
            behavior: 'smooth'
          });
        }
      });
    }
  }, [activeTab, showLeftFade, showRightFade]);

  // Check scroll position for fade visibility
  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftFade(scrollLeft > 8);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    
    // Re-check after items load
    const timeout = setTimeout(checkScroll, 100);
    
    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timeout);
    };
  }, [items, checkScroll]);

  const scrollTo = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = isMobile ? container.clientWidth * 0.6 : container.clientWidth * 0.5;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  // Render a single tab button
  const renderTabButton = (item: TabNavItem, isActive: boolean) => {
    const Icon = item.icon;
    
    return (
      <button
        key={item.id}
        ref={isActive ? activeTabRef : null}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${item.id}`}
        onClick={() => handleTabClick(item.id)}
        className={cn(
          // Base styles
          "flex items-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Touch-friendly sizing - min 44px height for accessibility
          "min-h-[44px] px-3 py-2 md:px-4 md:py-2.5",
          // Text size
          "text-sm",
          // Active state - strong visual highlight
          isActive 
            ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20" 
            : "hover:bg-muted/80 text-muted-foreground hover:text-foreground active:bg-muted"
        )}
      >
        {/* Icon is optional */}
        {Icon && <Icon className={cn(
          "h-4 w-4 flex-shrink-0",
          isActive ? "text-primary-foreground" : "text-muted-foreground"
        )} aria-hidden="true" />}
        {/* Text is always visible - required */}
        <span>{item.label}</span>
        {/* Badge for alerts count */}
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
      "w-full border-b bg-background sticky top-0 z-10 relative",
      className
    )}>
      {/* Left fade indicator */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-12 z-20 pointer-events-none transition-opacity duration-300",
          "bg-gradient-to-r from-background via-background/90 to-transparent",
          showLeftFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      
      {/* Left scroll button */}
      {showLeftFade && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 z-30",
            "h-8 w-8 rounded-full shadow-lg",
            "bg-background hover:bg-muted border-border"
          )}
          onClick={() => scrollTo("left")}
          aria-label="Rolar para a esquerda"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable tabs container - no visible scrollbar */}
      <div 
        ref={scrollContainerRef}
        className={cn(
          "overflow-x-auto overflow-y-hidden scroll-smooth",
          // Hide scrollbar on all browsers
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          // Touch scrolling
          "touch-pan-x"
        )}
      >
        <nav 
          className={cn(
            "flex gap-1.5 md:gap-2 min-w-max",
            // Padding to account for fade overlays and prevent overlap
            "py-2 px-2",
            showLeftFade && "pl-12",
            (showRightFade || secondaryItems.length > 0) && "pr-12"
          )}
          role="tablist" 
          aria-label="Navegação do prontuário"
        >
          {primaryItems.map((item) => {
            const isActive = activeTab === item.id;
            return renderTabButton(item, isActive);
          })}

          {/* "More" dropdown for secondary tabs on mobile */}
          {secondaryItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    activeInSecondary
                      ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20"
                      : "hover:bg-muted/80 text-muted-foreground hover:text-foreground active:bg-muted"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>Mais</span>
                  {activeInSecondary && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 bg-primary-foreground/20 text-primary-foreground">
                      {secondaryItems.find(i => i.id === activeTab)?.label.split(' ')[0]}
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-[60vh] overflow-y-auto">
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

      {/* Right fade indicator */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-12 z-20 pointer-events-none transition-opacity duration-300",
          "bg-gradient-to-l from-background via-background/90 to-transparent",
          showRightFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      
      {/* Right scroll button */}
      {showRightFade && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 z-30",
            "h-8 w-8 rounded-full shadow-lg",
            "bg-background hover:bg-muted border-border"
          )}
          onClick={() => scrollTo("right")}
          aria-label="Rolar para a direita"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
