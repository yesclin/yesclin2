import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DollarSign, Package, Lock, Info } from "lucide-react";
import { useAppointmentCostDetails } from "@/hooks/useAppointmentCostDetails";
import { usePermissions } from "@/hooks/usePermissions";

interface AppointmentCostDetailsProps {
  appointmentId: string;
  appointmentStatus?: string;
}

export function AppointmentCostDetails({ 
  appointmentId, 
  appointmentStatus 
}: AppointmentCostDetailsProps) {
  const { can, isLoading: permissionsLoading } = usePermissions();
  const { data: costDetails, isLoading } = useAppointmentCostDetails(appointmentId);

  // Only show for users with financial access
  const canViewCosts = can("financeiro", "view");

  // Don't show if not finalized
  if (appointmentStatus !== "finalizado") {
    return null;
  }

  // Show lock message if no permission
  if (!permissionsLoading && !canViewCosts) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Custos visíveis apenas para perfis autorizados</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || permissionsLoading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!costDetails) {
    return null;
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const hasMaterials = costDetails.consumed_materials.length > 0;
  const hasCost = costDetails.procedure_cost !== null && costDetails.procedure_cost > 0;

  if (!hasMaterials && !hasCost) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Custo do Procedimento
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">
                Valor histórico calculado no momento da execução. 
                Não é afetado por alterações futuras nos custos dos materiais.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Procedure Cost Summary */}
        {hasCost && (
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
            <span className="text-sm text-muted-foreground">
              {costDetails.procedure_name || "Procedimento"}
            </span>
            <Badge variant="secondary" className="font-mono">
              {formatCurrency(costDetails.procedure_cost)}
            </Badge>
          </div>
        )}

        {/* Consumed Materials List */}
        {hasMaterials && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>Materiais consumidos ({costDetails.consumed_materials.length})</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {costDetails.consumed_materials.map((material) => (
                <div 
                  key={material.id}
                  className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="truncate">{material.material_name}</span>
                    <span className="text-muted-foreground shrink-0">
                      × {material.quantity} {material.unit}
                    </span>
                  </div>
                  <span className="font-mono text-muted-foreground shrink-0">
                    {formatCurrency(material.total_cost)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Materials Total */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs font-medium">Total materiais</span>
              <span className="text-sm font-mono font-medium">
                {formatCurrency(costDetails.total_materials_cost)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
