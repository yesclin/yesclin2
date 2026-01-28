import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { GuidedTour } from "./GuidedTour";

export function AppLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <span className="text-lg font-semibold text-foreground">Yesclin</span>
          </header>
          <div className="flex-1 p-6">
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
