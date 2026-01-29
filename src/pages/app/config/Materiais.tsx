import { Package, Layers, Link2, Info, Settings, ShieldX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MaterialsTab } from "@/components/cadastros-clinicos/MaterialsTab";
import { ProcedureMaterialsTab } from "@/components/cadastros-clinicos/ProcedureMaterialsTab";
import { MaterialKitsTab } from "@/components/cadastros-clinicos/MaterialKitsTab";
import { MaterialConsumptionSettings } from "@/components/cadastros-clinicos/MaterialConsumptionSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/permissions/PermissionGate";

export default function ConfigMateriais() {
  const { isAdmin, can, isLoading } = usePermissions();
  // Permissão para visualizar a página: requer "configuracoes" + "view" e "estoque" + "view"
  const canView = isAdmin || (can("configuracoes", "view") && can("estoque", "view"));
  // Permissão para gerenciar: requer "configuracoes" + "edit" e "estoque" + "edit"
  const canManage = isAdmin || (can("configuracoes", "edit") && can("estoque", "edit"));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Acesso Restrito
        </h2>
        <p className="text-muted-foreground max-w-md">
          Você não tem permissão para acessar a configuração de cadastros clínicos.
          Entre em contato com o administrador da clínica.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Cadastros Clínicos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie materiais, kits e vínculos com procedimentos para calcular custos automaticamente
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Os cadastros clínicos impactam diretamente o custo dos procedimentos. 
          {canManage 
            ? " Alterar o custo de um material atualiza automaticamente todos os kits e procedimentos vinculados."
            : " Você possui acesso somente para visualização."}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="links" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Vínculos
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materiais
          </TabsTrigger>
          <TabsTrigger value="kits" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Kits
          </TabsTrigger>
          <TabsTrigger value="consumption" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Baixa Automática
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links">
          <ProcedureMaterialsTab />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialsTab />
        </TabsContent>

        <TabsContent value="kits">
          <MaterialKitsTab />
        </TabsContent>

        <TabsContent value="consumption">
          <MaterialConsumptionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
