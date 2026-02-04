import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions, AppModule, AppAction } from "@/hooks/usePermissions";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldX } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  module: AppModule;
  action?: AppAction;
  redirectTo?: string;
}

/**
 * Route-level permission guard
 * - Shows loading state while permissions are being fetched
 * - Redirects or shows blocked message when access is denied
 * - Renders children when access is granted
 */
export function ProtectedRoute({
  children,
  module,
  action = "view",
  redirectTo,
}: ProtectedRouteProps) {
  const { can, isLoading, isOwner, isAdmin } = usePermissions();

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Owner and Admin bypass all permission checks
  if (isOwner || isAdmin) {
    return <>{children}</>;
  }

  // Check permission
  if (!can(module, action)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return <AccessDeniedPage module={module} />;
  }

  return <>{children}</>;
}

const moduleLabels: Record<AppModule, string> = {
  dashboard: "Dashboard",
  agenda: "Agenda",
  atendimento: "Atendimento",
  pacientes: "Pacientes",
  prontuario: "Prontuário",
  comunicacao: "Marketing",
  financeiro: "Financeiro",
  meu_financeiro: "Meu Financeiro",
  convenios: "Convênios",
  estoque: "Estoque",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};

function AccessDeniedPage({ module }: { module: AppModule }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldX className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Acesso Restrito
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Você não tem permissão para acessar o módulo <strong>{moduleLabels[module]}</strong>.
        Entre em contato com o administrador da clínica para solicitar acesso.
      </p>
    </div>
  );
}
