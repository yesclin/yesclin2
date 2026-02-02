import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Procedure,
  ProcedureFormData,
  useProcedureForm,
  useCreateProcedure,
  useUpdateProcedure,
} from "@/hooks/useProceduresCRUD";
import {
  useProcedureProductsByProcedure,
  useCreateProcedureProduct,
  useDeleteProcedureProduct,
  useUpdateProcedureProduct,
} from "@/hooks/useProcedureProductsCRUD";
import {
  ProcedureProductsSection,
  type ProcedureProductItem,
} from "./ProcedureProductsSection";

const SPECIALTIES = [
  "Clínica Geral",
  "Dermatologia",
  "Estética",
  "Cardiologia",
  "Ortopedia",
  "Nutrição",
  "Psicologia",
  "Fisioterapia",
  "Fonoaudiologia",
  "Odontologia",
];

interface ProcedureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: Procedure | null;
  mode: "create" | "edit";
}

export function ProcedureFormDialog({
  open,
  onOpenChange,
  procedure,
  mode,
}: ProcedureFormDialogProps) {
  const { formData, updateField, resetForm, loadProcedure, isValid } = useProcedureForm();
  const createMutation = useCreateProcedure();
  const updateMutation = useUpdateProcedure();

  // Products linked to procedure
  const { data: existingProducts = [] } = useProcedureProductsByProcedure(
    mode === "edit" && procedure ? procedure.id : null
  );
  const createProductMutation = useCreateProcedureProduct();
  const updateProductMutation = useUpdateProcedureProduct();
  const deleteProductMutation = useDeleteProcedureProduct();

  const [productItems, setProductItems] = useState<ProcedureProductItem[]>([]);

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    deleteProductMutation.isPending;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && procedure) {
        loadProcedure(procedure);
      } else {
        resetForm();
        setProductItems([]);
      }
    }
  }, [open, mode, procedure]);

  // Sync existing products when editing
  useEffect(() => {
    if (mode === "edit" && existingProducts.length > 0) {
      setProductItems(
        existingProducts.map((p) => ({
          product_id: p.product_id,
          product_name: p.product_name || "",
          product_unit: p.product_unit || "",
          quantity: p.quantity,
        }))
      );
    }
  }, [existingProducts, mode]);

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      let procedureId: string;

      if (mode === "edit" && procedure) {
        await updateMutation.mutateAsync({ id: procedure.id, formData });
        procedureId = procedure.id;

        // Sync products: delete removed, update existing, add new
        const existingIds = existingProducts.map((p) => p.product_id);
        const newIds = productItems.map((p) => p.product_id);

        // Delete removed products
        for (const existing of existingProducts) {
          if (!newIds.includes(existing.product_id)) {
            await deleteProductMutation.mutateAsync({
              id: existing.id,
              procedureId,
            });
          }
        }

        // Update or add products
        for (const item of productItems) {
          const existingItem = existingProducts.find(
            (p) => p.product_id === item.product_id
          );
          if (existingItem) {
            // Update if quantity changed
            if (existingItem.quantity !== item.quantity) {
              await updateProductMutation.mutateAsync({
                id: existingItem.id,
                procedureId,
                formData: { quantity: item.quantity },
              });
            }
          } else {
            // Add new product
            await createProductMutation.mutateAsync({
              procedure_id: procedureId,
              product_id: item.product_id,
              quantity: item.quantity,
            });
          }
        }
      } else {
        const newProcedure = await createMutation.mutateAsync(formData);
        procedureId = newProcedure.id;

        // Add all products
        for (const item of productItems) {
          await createProductMutation.mutateAsync({
            procedure_id: procedureId,
            product_id: item.product_id,
            quantity: item.quantity,
          });
        }
      }

      onOpenChange(false);
      resetForm();
      setProductItems([]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      resetForm();
      setProductItems([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar Procedimento" : "Novo Procedimento"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize os dados do procedimento"
              : "Cadastre um novo procedimento para a clínica"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Procedimento *</Label>
            <Input
              id="name"
              placeholder="Ex: Consulta Inicial"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="specialty">Especialidade</Label>
            <Select
              value={formData.specialty}
              onValueChange={(value) => updateField("specialty", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do procedimento..."
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Duração (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => updateField("duration_minutes", Math.max(5, parseInt(e.target.value) || 5))}
                min={5}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Mínimo: 5 minutos</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Valor (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min={0}
                placeholder="0,00"
                value={formData.price || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateField("price", isNaN(val) ? undefined : Math.max(0, val));
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permite Retorno</Label>
              <p className="text-sm text-muted-foreground">
                Paciente pode agendar retorno sem cobrança
              </p>
            </div>
            <Switch
              checked={formData.allows_return}
              onCheckedChange={(checked) => updateField("allows_return", checked)}
              disabled={isLoading}
            />
          </div>

          {formData.allows_return && (
            <div className="grid gap-2">
              <Label htmlFor="return_days">Prazo para Retorno (dias)</Label>
              <Input
                id="return_days"
                type="number"
                value={formData.return_days || 15}
                onChange={(e) => updateField("return_days", parseInt(e.target.value) || 15)}
                min={1}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Products/Materials Section */}
          <Separator className="my-2" />
          <ProcedureProductsSection
            items={productItems}
            onChange={setProductItems}
            disabled={isLoading}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : mode === "edit" ? (
              "Salvar Alterações"
            ) : (
              "Criar Procedimento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
