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

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  tourId?: string;
}

const mainMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, tourId: "dashboard" },
  { title: "Agenda", url: "/app/agenda", icon: Calendar, tourId: "agenda" },
  { title: "Pacientes", url: "/app/pacientes", icon: Users, tourId: "patients" },
  { title: "Prontuário", url: "/app/prontuario", icon: FileText, tourId: "medical-record" },
  { title: "Marketing", url: "/app/marketing", icon: Megaphone, tourId: "communication" },
];

const gestaoItems: MenuItem[] = [
  { title: "Controle de Estoque", url: "/app/gestao/estoque", icon: Package },
  { title: "Finanças", url: "/app/gestao/financas", icon: DollarSign },
  { title: "Convênios", url: "/app/gestao/convenios", icon: Building2 },
  { title: "Relatórios", url: "/app/gestao/relatorios", icon: BarChart3 },
];

const configItems: MenuItem[] = [
  { title: "Procedimentos", url: "/app/config/procedimentos", icon: ListChecks },
  { title: "Clínica", url: "/app/config/clinica", icon: Building },
  { title: "Usuários & Permissões", url: "/app/config/usuarios", icon: UserCog },
  { title: "Cadastros Clínicos", url: "/app/config/materiais", icon: Package },
  { title: "Agenda", url: "/app/config/agenda", icon: CalendarCog },
  { title: "Atendimento", url: "/app/config/atendimento", icon: Stethoscope },
  { title: "Prontuário", url: "/app/config/prontuario", icon: FileText },
  { title: "LGPD & Segurança", url: "/app/config/seguranca", icon: Shield },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/app") return currentPath === path;
    return currentPath.startsWith(path);
  };

  const isGestaoActive = gestaoItems.some((item) => isActive(item.url));
  const isConfigActive = configItems.some((item) => isActive(item.url));

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Y</span>
            </div>
            <span className={cn(
              "font-semibold text-lg text-sidebar-foreground truncate transition-opacity duration-200",
              isCollapsed && "opacity-0 w-0"
            )}>
              Yesclin
            </span>
          </div>
        </div>

        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title} data-tour={item.tourId}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className={cn(
                        "truncate transition-opacity duration-200",
                        isCollapsed && "opacity-0 w-0 overflow-hidden"
                      )}>
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestão */}
        <SidebarGroup data-tour="management">
          <Collapsible defaultOpen={isGestaoActive || !isCollapsed}>
            <CollapsibleTrigger className={cn("w-full", isCollapsed && "pointer-events-none")}>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <span className={cn(isCollapsed && "sr-only")}>Gestão</span>
                <ChevronDown className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180",
                  isCollapsed && "hidden"
                )} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {gestaoItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className={cn(
                            "truncate transition-opacity duration-200",
                            isCollapsed && "opacity-0 w-0 overflow-hidden"
                          )}>
                            {item.title}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup data-tour="settings">
          <Collapsible defaultOpen={isConfigActive || !isCollapsed}>
            <CollapsibleTrigger className={cn("w-full", isCollapsed && "pointer-events-none")}>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Settings className="h-4 w-4 shrink-0" />
                  <span className={cn(
                    "truncate transition-opacity duration-200",
                    isCollapsed && "opacity-0 w-0 overflow-hidden"
                  )}>
                    Configurações
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180",
                  isCollapsed && "hidden"
                )} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {configItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className={cn(
                            "truncate transition-opacity duration-200",
                            isCollapsed && "opacity-0 w-0 overflow-hidden"
                          )}>
                            {item.title}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-0 border-t border-sidebar-border" data-tour="user-profile">
        <UserProfileFooter />
      </SidebarFooter>
    </Sidebar>
  );
}