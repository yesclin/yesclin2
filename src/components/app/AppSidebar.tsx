import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Building2,
  Megaphone,
  Settings,
  DollarSign,
  Package,
  BarChart3,
  Building,
  UserCog,
  Stethoscope,
  ListChecks,
  CalendarCog,
  Shield,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePermissions, AppModule } from "@/hooks/usePermissions";
import { UserProfileFooter } from "./UserProfileFooter";

// MenuItem interface moved down with tourId

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  module?: AppModule;
  tourId?: string;
}

const mainMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, module: "dashboard", tourId: "dashboard" },
  { title: "Agenda", url: "/app/agenda", icon: Calendar, module: "agenda", tourId: "agenda" },
  { title: "Pacientes", url: "/app/pacientes", icon: Users, module: "pacientes", tourId: "patients" },
  { title: "Prontuário", url: "/app/prontuario", icon: FileText, module: "prontuario", tourId: "medical-record" },
  { title: "Marketing", url: "/app/marketing", icon: Megaphone, module: "comunicacao", tourId: "communication" },
];

const gestaoItems: MenuItem[] = [
  { title: "Controle de Estoque", url: "/app/gestao/estoque", icon: Package, module: "estoque" },
  { title: "Finanças", url: "/app/gestao/financas", icon: DollarSign, module: "financeiro" },
  { title: "Convênios", url: "/app/gestao/convenios", icon: Building2, module: "convenios" },
  { title: "Relatórios", url: "/app/gestao/relatorios", icon: BarChart3, module: "relatorios" },
];

const configItems: MenuItem[] = [
  { title: "Procedimentos", url: "/app/config/procedimentos", icon: ListChecks, module: "configuracoes" },
  { title: "Clínica", url: "/app/config/clinica", icon: Building, module: "configuracoes" },
  { title: "Usuários & Permissões", url: "/app/config/usuarios", icon: UserCog, module: "configuracoes" },
  { title: "Cadastros Clínicos", url: "/app/config/materiais", icon: Package, module: "configuracoes" },
  { title: "Agenda", url: "/app/config/agenda", icon: CalendarCog, module: "configuracoes" },
  { title: "Atendimento", url: "/app/config/atendimento", icon: Stethoscope, module: "configuracoes" },
  { title: "Prontuário", url: "/app/config/prontuario", icon: FileText, module: "configuracoes" },
  { title: "LGPD & Segurança", url: "/app/config/seguranca", icon: Shield, module: "configuracoes" },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { can, isLoading } = usePermissions();

  const isActive = (path: string) => {
    if (path === "/app") return currentPath === path;
    return currentPath.startsWith(path);
  };

  // Filter items based on permissions
  // Always show menu items during loading or when no user is logged in
  // This ensures the sidebar is always visible and navigable
  const filterByPermission = (items: MenuItem[]) => {
    // During loading, show all items to prevent empty sidebar
    if (isLoading) return items;
    // If no permissions loaded (not logged in), show all items for navigation
    // RLS will protect actual data access
    return items.filter(item => !item.module || can(item.module, "view"));
  };

  // Always show main menu items regardless of permission state
  // This prevents the sidebar from being completely empty
  const visibleMainItems = isLoading ? mainMenuItems : filterByPermission(mainMenuItems);
  const visibleGestaoItems = filterByPermission(gestaoItems);
  const visibleConfigItems = filterByPermission(configItems);

  const isGestaoActive = visibleGestaoItems.some((item) => isActive(item.url));
  const isConfigActive = visibleConfigItems.some((item) => isActive(item.url));

  // Check if user can access config at all
  const canAccessConfig = can("configuracoes", "view");

  return (
    <Sidebar className="border-r">
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Y</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Yesclin</span>
          </div>
        </div>

        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title} data-tour={item.tourId}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestão - only show if user has access to any gestao module */}
        {visibleGestaoItems.length > 0 && (
          <SidebarGroup data-tour="management">
            <Collapsible defaultOpen={isGestaoActive}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                  <span>Gestão</span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleGestaoItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)}>
                          <NavLink to={item.url} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Configurações - only show for users with config access */}
        {canAccessConfig && visibleConfigItems.length > 0 && (
          <SidebarGroup data-tour="settings">
            <Collapsible defaultOpen={isConfigActive}>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleConfigItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)}>
                          <NavLink to={item.url} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-0" data-tour="user-profile">
        <UserProfileFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
