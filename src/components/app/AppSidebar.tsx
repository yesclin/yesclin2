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
  type LucideIcon,
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserProfileFooter } from "./UserProfileFooter";
import { cn } from "@/lib/utils";
import { usePermissions, AppModule } from "@/hooks/usePermissions";
import { useMemo } from "react";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  tourId?: string;
  /** Permission module required to see this item. If undefined, always visible. */
  requiredModule?: AppModule;
}

// Main menu - clinical and shared
const mainMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, tourId: "dashboard", requiredModule: "dashboard" },
  { title: "Agenda", url: "/app/agenda", icon: Calendar, tourId: "agenda", requiredModule: "agenda" },
  { title: "Pacientes", url: "/app/pacientes", icon: Users, tourId: "patients", requiredModule: "pacientes" },
  { title: "Prontuário", url: "/app/prontuario", icon: FileText, tourId: "medical-record", requiredModule: "prontuario" },
  { title: "Marketing", url: "/app/marketing", icon: Megaphone, tourId: "communication", requiredModule: "comunicacao" },
];

// Management section
const gestaoItems: MenuItem[] = [
  { title: "Controle de Estoque", url: "/app/gestao/estoque", icon: Package, requiredModule: "estoque" },
  { title: "Finanças", url: "/app/gestao/financas", icon: DollarSign, requiredModule: "financeiro" },
  { title: "Convênios", url: "/app/gestao/convenios", icon: Building2, requiredModule: "convenios" },
  { title: "Relatórios", url: "/app/gestao/relatorios", icon: BarChart3, requiredModule: "relatorios" },
];

// Settings section - always visible for those with configuracoes permission
const configItems: MenuItem[] = [
  { title: "Procedimentos", url: "/app/config/procedimentos", icon: ListChecks, requiredModule: "configuracoes" },
  { title: "Clínica", url: "/app/config/clinica", icon: Building, requiredModule: "configuracoes" },
  { title: "Usuários & Permissões", url: "/app/config/usuarios", icon: UserCog, requiredModule: "configuracoes" },
  { title: "Cadastros Clínicos", url: "/app/config/materiais", icon: Package, requiredModule: "configuracoes" },
  { title: "Agenda", url: "/app/config/agenda", icon: CalendarCog, requiredModule: "configuracoes" },
  { title: "Atendimento", url: "/app/config/atendimento", icon: Stethoscope, requiredModule: "configuracoes" },
  { title: "Prontuário", url: "/app/config/prontuario", icon: FileText, requiredModule: "configuracoes" },
  { title: "LGPD & Segurança", url: "/app/config/seguranca", icon: Shield, requiredModule: "configuracoes" },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { can, isAdmin, isOwner, isLoading: permissionsLoading } = usePermissions();

  const isActive = (path: string) => {
    if (path === "/app") return currentPath === path;
    return currentPath.startsWith(path);
  };

  // Filter menu items based on permissions
  const filterByPermission = useMemo(() => {
    return (items: MenuItem[]) => {
      // Admin/Owner sees everything
      if (isAdmin || isOwner) return items;
      // Filter based on permissions
      return items.filter((item) => {
        if (!item.requiredModule) return true;
        return can(item.requiredModule, "view");
      });
    };
  }, [can, isAdmin, isOwner]);

  const visibleMainItems = useMemo(() => filterByPermission(mainMenuItems), [filterByPermission]);
  const visibleGestaoItems = useMemo(() => filterByPermission(gestaoItems), [filterByPermission]);
  const visibleConfigItems = useMemo(() => filterByPermission(configItems), [filterByPermission]);

  const isGestaoActive = visibleGestaoItems.some((item) => isActive(item.url));
  const isConfigActive = visibleConfigItems.some((item) => isActive(item.url));

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className={cn(
          "border-b border-sidebar-border transition-all duration-200",
          isCollapsed ? "p-2 flex justify-center" : "p-4"
        )}>
          <div className={cn(
            "flex items-center min-w-0",
            isCollapsed ? "justify-center" : "gap-2"
          )}>
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Y</span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-lg text-sidebar-foreground truncate">
                Yesclin
              </span>
            )}
          </div>
        </div>

        {/* Menu Principal */}
        {visibleMainItems.length > 0 && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainItems.map((item) => (
                  <SidebarMenuItem key={item.title} data-tour={item.tourId}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      tooltip={isCollapsed ? item.title : undefined}
                    >
                      <NavLink 
                        to={item.url} 
                        className={cn(
                          "flex items-center",
                          isCollapsed ? "justify-center" : "gap-2"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Gestão */}
        {visibleGestaoItems.length > 0 && (
          <SidebarGroup data-tour="management">
            {isCollapsed ? (
              // Collapsed: show only icons without grouping
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleGestaoItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url} className="flex items-center justify-center">
                          <item.icon className="h-4 w-4 shrink-0" />
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              // Expanded: show collapsible group with labels
              <Collapsible defaultOpen={isGestaoActive}>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors">
                    <span>Gestão</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleGestaoItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive(item.url)}
                          >
                            <NavLink to={item.url} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            )}
          </SidebarGroup>
        )}

        {/* Configurações */}
        {visibleConfigItems.length > 0 && (
          <SidebarGroup data-tour="settings">
            {isCollapsed ? (
              // Collapsed: show only icons without grouping
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleConfigItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url} className="flex items-center justify-center">
                          <item.icon className="h-4 w-4 shrink-0" />
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              // Expanded: show collapsible group with labels
              <Collapsible defaultOpen={isConfigActive}>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Settings className="h-4 w-4 shrink-0" />
                      <span className="truncate">Configurações</span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleConfigItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={isActive(item.url)}
                          >
                            <NavLink to={item.url} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-0 border-t border-sidebar-border" data-tour="user-profile">
        <UserProfileFooter />
      </SidebarFooter>
    </Sidebar>
  );
}