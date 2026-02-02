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
import { UserProfileFooter } from "./UserProfileFooter";
import { usePermissions, AppModule } from "@/hooks/usePermissions";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  tourId?: string;
  module?: AppModule; // Module permission required
  requiresOwner?: boolean; // Only visible to owner
}

const mainMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, tourId: "dashboard", module: "dashboard" },
  { title: "Agenda", url: "/app/agenda", icon: Calendar, tourId: "agenda", module: "agenda" },
  { title: "Pacientes", url: "/app/pacientes", icon: Users, tourId: "patients", module: "pacientes" },
  { title: "Prontuário", url: "/app/prontuario", icon: FileText, tourId: "medical-record", module: "prontuario" },
  { title: "Marketing", url: "/app/marketing", icon: Megaphone, tourId: "communication", module: "comunicacao" },
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
  { title: "Usuários & Permissões", url: "/app/config/usuarios", icon: UserCog, requiresOwner: true },
  { title: "Cadastros Clínicos", url: "/app/config/materiais", icon: Package, module: "configuracoes" },
  { title: "Agenda", url: "/app/config/agenda", icon: CalendarCog, module: "configuracoes" },
  { title: "Atendimento", url: "/app/config/atendimento", icon: Stethoscope, module: "configuracoes" },
  { title: "Prontuário", url: "/app/config/prontuario", icon: FileText, module: "configuracoes" },
  { title: "LGPD & Segurança", url: "/app/config/seguranca", icon: Shield, module: "configuracoes" },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { can, isOwner, isLoading } = usePermissions();

  const isActive = (path: string) => {
    if (path === "/app") return currentPath === path;
    return currentPath.startsWith(path);
  };

  // Filter menu items based on permissions (HIDE instead of disable)
  const filterMenuItems = (items: MenuItem[]) => {
    if (isLoading) return []; // Don't show anything while loading
    
    return items.filter(item => {
      // Owner sees everything
      if (isOwner) return true;
      
      // Items requiring owner are hidden for non-owners
      if (item.requiresOwner) return false;
      
      // Check module permission if specified
      if (item.module) {
        return can(item.module, "view");
      }
      
      return true;
    });
  };

  const visibleMainItems = filterMenuItems(mainMenuItems);
  const visibleGestaoItems = filterMenuItems(gestaoItems);
  const visibleConfigItems = filterMenuItems(configItems);

  const isGestaoActive = gestaoItems.some((item) => isActive(item.url));
  const isConfigActive = configItems.some((item) => isActive(item.url));

  // Hide entire sections if no items are visible
  const showGestao = visibleGestaoItems.length > 0;
  const showConfig = visibleConfigItems.length > 0;

  return (
    <Sidebar className="border-r" collapsible="icon">
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

        {/* Gestão - Only show if user has access to at least one item */}
        {showGestao && (
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

        {/* Configurações - Only show if user has access */}
        {showConfig && (
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
