import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Menu, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export interface TabNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
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
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = activeTabRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      
      // Check if active tab is outside visible area
      if (activeRect.left < containerRect.left) {
        container.scrollLeft -= (containerRect.left - activeRect.left) + 20;
      } else if (activeRect.right > containerRect.right) {
        container.scrollLeft += (activeRect.right - containerRect.right) + 20;
      }
    }
  }, [activeTab]);

  // Check scroll position for arrow visibility
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    
    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items]);

  const scrollTo = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.6;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    if (isMobile) {
      setSheetOpen(false);
    }
  };

  const activeItem = items.find(item => item.id === activeTab);

  // Mobile: Show current tab + menu button to open sheet
  if (isMobile) {
    return (
      <div className={cn("w-full border-b bg-background sticky top-0 z-10", className)}>
        <div className="flex items-center justify-between p-2 gap-2">
          {/* Current Tab Display */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {activeItem?.icon && (
              <activeItem.icon className="h-5 w-5 text-primary flex-shrink-0" />
            )}
            <span className="font-medium text-sm truncate">
              {activeItem?.label || "Selecione uma aba"}
            </span>
            {activeItem?.badge && activeItem.badge > 0 && (
              <Badge 
                variant={activeItem.badgeVariant || "secondary"}
                className="text-[10px] px-1.5 flex-shrink-0"
              >
                {activeItem.badge}
              </Badge>
            )}
          </div>

          {/* Menu Button */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Menu className="h-4 w-4 mr-1.5" />
                Módulos
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Módulos do Prontuário</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100%-60px)]">
                <div className="grid gap-1.5 pr-4">
                  {items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        )}
                      >
                        {Icon && (
                          <Icon className={cn(
                            "h-5 w-5 flex-shrink-0",
                            isActive ? "text-primary-foreground" : "text-muted-foreground"
                          )} />
                        )}
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <Badge 
                            variant={isActive ? "secondary" : (item.badgeVariant || "secondary")}
                            className="text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  // Desktop/Tablet: Horizontal scrollable tabs with arrows
  return (
    <div className={cn("w-full border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10 relative", className)}>
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/90 shadow-md hover:bg-background"
          onClick={() => scrollTo("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable tabs container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <nav 
          className="flex p-2 gap-1.5 min-w-max px-10" 
          role="tablist" 
          aria-label="Navegação do prontuário"
        >
          {items.map((item) => {
            const isActive = activeTab === item.id;
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
                  "flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                <span className="hidden sm:inline">{item.label}</span>
                {/* Show label on tablet+ */}
                <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant={isActive ? "secondary" : (item.badgeVariant || "secondary")}
                    className="text-[10px] px-1.5 ml-0.5"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right scroll arrow */}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/90 shadow-md hover:bg-background"
          onClick={() => scrollTo("right")}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
