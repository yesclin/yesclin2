import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { GuidedTour } from "./GuidedTour";
import { useCallback, useState } from "react";

// Persistir estado do sidebar no localStorage para evitar reset
const SIDEBAR_STORAGE_KEY = "yesclin-sidebar-open";

function getSavedSidebarState(): boolean {
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved !== "false"; // default true
  } catch {
    return true;
  }
}

export function AppLayout() {
  const location = useLocation();
  
  // Estado controlado do sidebar com persistência
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(getSavedSidebarState);
  
  const handleSidebarChange = useCallback((open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <SidebarProvider 
      open={sidebarOpen} 
      onOpenChange={handleSidebarChange}
      defaultOpen={true}
    >
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar SEMPRE renderizado - não condicionado a nenhum estado */}
        <AppSidebar />
        
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center px-4 bg-card shrink-0">
            <SidebarTrigger className="mr-4" />
            <span className="text-lg font-semibold text-foreground">Yesclin</span>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Onboarding Wizard */}
      <OnboardingWizard />
      
      {/* Guided Tour for first-time users */}
      {location.pathname === "/app" && <GuidedTour />}
    </SidebarProvider>
  );
}
