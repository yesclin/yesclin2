import { Package, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useProcedureProductsByProcedure, ProcedureProduct } from "@/hooks/useProcedureProductsCRUD";

interface ProcedureProductsPreviewProps {
  procedureId: string | null;
  procedureName?: string;
}

export function ProcedureProductsPreview({ 
  procedureId,
  procedureName 
}: ProcedureProductsPreviewProps) {
  const { 
    data: products = [], 
    isLoading, 
    isError 
  } = useProcedureProductsByProcedure(procedureId);

  if (!procedureId || procedureId === "none") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Package className="h-4 w-4" />
          Carregando produtos...
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3 border rounded-lg bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Erro ao carregar produtos do procedimento
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          Nenhum produto configurado para este procedimento
        </div>
      </div>
    );
  }

  // Calculate total estimated cost
  const totalCost = products.reduce((sum, p) => {
    return sum + (p.product_cost_price || 0) * p.quantity;
  }, 0);

  return (
    <div className="p-3 border rounded-lg bg-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4 text-primary" />
          Produtos a consumir
        </div>
        <Badge variant="secondary" className="text-xs">
          {products.length} {products.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>
      
      <div className="space-y-1.5">
        {products.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </div>

      {totalCost > 0 && (
        <div className="pt-2 border-t flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Custo estimado:</span>
          <span className="font-medium">
            {totalCost.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
      )}
    </div>
  );
}

interface ProductRowProps {
  product: ProcedureProduct;
}

function ProductRow({ product }: ProductRowProps) {
  const unitCost = product.product_cost_price || 0;
  const totalCost = unitCost * product.quantity;

  return (
    <div className="flex items-center justify-between text-sm py-1 px-2 rounded bg-background/50">
      <div className="flex items-center gap-2">
        <span className="font-medium">{product.product_name}</span>
        {product.product_unit && (
          <span className="text-xs text-muted-foreground">
            ({product.product_unit})
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs font-normal">
          Qtd: {product.quantity}
        </Badge>
        {totalCost > 0 && (
          <span className="text-xs text-muted-foreground">
            {totalCost.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
