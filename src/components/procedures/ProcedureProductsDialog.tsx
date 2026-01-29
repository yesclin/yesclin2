import { useState, useEffect } from "react";
import { Package, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import {
  useProcedureProductsByProcedure,
  useCreateProcedureProduct,
  useDeleteProcedureProduct,
  useUpdateProcedureProduct,
  type ProcedureProduct,
} from "@/hooks/useProcedureProductsCRUD";
import { Procedure } from "@/hooks/useProceduresCRUD";

interface ProcedureProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure: Procedure | null;
}

export function ProcedureProductsDialog({
  open,
  onOpenChange,
  procedure,
}: ProcedureProductsDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: procedureProducts, isLoading: linkLoading } = useProcedureProductsByProcedure(
    procedure?.id ?? null
  );

  const createMutation = useCreateProcedureProduct();
  const deleteMutation = useDeleteProcedureProduct();
  const updateMutation = useUpdateProcedureProduct();

  const isLoading = createMutation.isPending || deleteMutation.isPending || updateMutation.isPending;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProductId("");
      setQuantity(1);
      setEditingId(null);
    }
  }, [open]);

  // Get available products (not yet linked to this procedure)
  const linkedProductIds = new Set((procedureProducts || []).map((pp) => pp.product_id));
  const availableProducts = (products || []).filter((p) => !linkedProductIds.has(p.id));

  const handleAddProduct = async () => {
    if (!procedure?.id || !selectedProductId || quantity <= 0) return;

    await createMutation.mutateAsync({
      procedure_id: procedure.id,
      product_id: selectedProductId,
      quantity,
    });

    setSelectedProductId("");
    setQuantity(1);
  };

  const handleRemoveProduct = async (item: ProcedureProduct) => {
    if (!procedure?.id) return;
    await deleteMutation.mutateAsync({ id: item.id, procedureId: procedure.id });
  };

  const handleStartEdit = (item: ProcedureProduct) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity);
  };

  const handleSaveEdit = async (item: ProcedureProduct) => {
    if (!procedure?.id || editQuantity <= 0) return;

    await updateMutation.mutateAsync({
      id: item.id,
      procedureId: procedure.id,
      formData: { quantity: editQuantity },
    });

    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const totalCost = (procedureProducts || []).reduce((sum, pp) => {
    const cost = pp.product_cost_price || 0;
    return sum + cost * pp.quantity;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Produtos do Procedimento
          </DialogTitle>
          <DialogDescription>
            Configure os produtos do estoque utilizados em "{procedure?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new product form */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-3">Adicionar Produto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,120px,auto] gap-3 items-end">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                  disabled={isLoading || productsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum produto disponível
                      </div>
                    ) : (
                      availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.unit})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={0.001}
                  step={0.001}
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleAddProduct}
                disabled={!selectedProductId || quantity <= 0 || isLoading}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Current products list */}
          <div>
            <h4 className="font-medium mb-3">Produtos Vinculados</h4>
            {linkLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (procedureProducts || []).length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum produto vinculado a este procedimento.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedureProducts?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product_name}
                        </TableCell>
                        <TableCell>{item.product_unit}</TableCell>
                        <TableCell>
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0.001}
                                step={0.001}
                                value={editQuantity}
                                onChange={(e) =>
                                  setEditQuantity(parseFloat(e.target.value) || 1)
                                }
                                className="w-20 h-8"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(item)}
                                disabled={isLoading}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:underline"
                              onClick={() => handleStartEdit(item)}
                            >
                              {item.quantity}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(item.product_cost_price || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          {((item.product_cost_price || 0) * item.quantity).toLocaleString(
                            "pt-BR",
                            { style: "currency", currency: "BRL" }
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProduct(item)}
                            disabled={isLoading}
                            title="Remover produto"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Total cost */}
                <div className="mt-4 flex justify-end">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Custo Total: </span>
                    <span className="font-semibold text-lg">
                      {totalCost.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
