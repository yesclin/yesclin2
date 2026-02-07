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

  // Separate primary and secondary tabs for mobile "More" menu
  const primaryItems = isMobile ? items.filter(item => !item.secondary) : items;
  const secondaryItems = isMobile ? items.filter(item => item.secondary) : [];

  // Check if active tab is in secondary items (need to show in "More" menu)
  const activeInSecondary = secondaryItems.some(item => item.id === activeTab);

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = activeTabRef.current;
      
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        
        // Check if active tab is outside visible area
        if (activeRect.left < containerRect.left + 40) {
          container.scrollTo({
            left: container.scrollLeft - (containerRect.left - activeRect.left) - 60,
            behavior: 'smooth'
          });
        } else if (activeRect.right > containerRect.right - 40) {
          container.scrollTo({
            left: container.scrollLeft + (activeRect.right - containerRect.right) + 60,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }, [activeTab]);

  // Check scroll position for fade visibility
  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftFade(scrollLeft > 5);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
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
    
    const scrollAmount = isMobile ? container.clientWidth * 0.5 : container.clientWidth * 0.4;
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
          "flex items-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          // Responsive padding
          "px-2.5 py-2 md:px-3 md:py-2.5 lg:px-4",
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
        {/* Mobile: show abbreviated label, Desktop: full label */}
        <span className="hidden sm:inline">{item.label}</span>
        <span className="sm:hidden text-xs max-w-[60px] truncate">{item.label}</span>
        {item.badge && item.badge > 0 && (
          <Badge 
            variant={isActive ? "secondary" : (item.badgeVariant || "secondary")}
            className="text-[10px] px-1 h-4 min-w-[16px] flex-shrink-0"
          >
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <div className={cn("w-full border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10 relative", className)}>
      {/* Left fade indicator + scroll button */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-10 md:w-14 z-20 pointer-events-none transition-opacity duration-200",
          "bg-gradient-to-r from-background via-background/80 to-transparent",
          showLeftFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      {showLeftFade && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 h-7 w-7 md:h-8 md:w-8 rounded-full bg-background/90 shadow-md hover:bg-background border"
          onClick={() => scrollTo("left")}
          aria-label="Rolar para a esquerda"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable tabs container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-hidden scroll-smooth touch-pan-x"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .scroll-container::-webkit-scrollbar { display: none; }
        `}} />
        <nav 
          className="flex p-1.5 md:p-2 gap-1 md:gap-1.5 min-w-max scroll-container" 
          role="tablist" 
          aria-label="Navegação do prontuário"
          style={{ paddingLeft: showLeftFade ? '2.5rem' : '0.375rem', paddingRight: showRightFade || secondaryItems.length > 0 ? '2.5rem' : '0.375rem' }}
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
                    "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    activeInSecondary
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="text-xs">Mais</span>
                  {activeInSecondary && (
                    <span className="text-xs opacity-80">
                      ({secondaryItems.find(i => i.id === activeTab)?.label.split(' ')[0]})
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
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

      {/* Right fade indicator + scroll button */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-10 md:w-14 z-20 pointer-events-none transition-opacity duration-200",
          "bg-gradient-to-l from-background via-background/80 to-transparent",
          showRightFade ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      {showRightFade && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-30 h-7 w-7 md:h-8 md:w-8 rounded-full bg-background/90 shadow-md hover:bg-background border"
          onClick={() => scrollTo("right")}
          aria-label="Rolar para a direita"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
