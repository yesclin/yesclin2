import { useState, useCallback, useMemo } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProductSaleSelector, type SelectedProduct, type StockValidationError } from "@/components/gestao/ProductSaleSelector";
import { useCreateSale } from "@/hooks/useSales";
import { toast } from "sonner";
import { paymentMethods } from "@/types/gestao";

interface ProductSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  appointmentId: string;
  onSuccess?: () => void;
}

export function ProductSaleDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  appointmentId,
  onSuccess,
}: ProductSaleDialogProps) {
  const createSale = useCreateSale();
  
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productSaleTotal, setProductSaleTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<StockValidationError[]>([]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  const handleProductTotalChange = useCallback((total: number) => {
    setProductSaleTotal(total);
  }, []);

  const handleValidationChange = useCallback((errors: StockValidationError[]) => {
    setValidationErrors(errors);
  }, []);

  const canSubmit = useMemo(() => {
    return selectedProducts.length > 0 && validationErrors.length === 0;
  }, [selectedProducts, validationErrors]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      await createSale.mutateAsync({
        sale_date: new Date().toISOString().split('T')[0],
        patient_id: patientId,
        appointment_id: appointmentId,
        payment_method: paymentMethod || undefined,
        payment_status: 'pago',
        notes: notes || undefined,
        items: selectedProducts.map(sp => ({
          product_id: sp.product.id,
          product_name: sp.product.name,
          quantity: sp.quantity,
          unit_price: sp.product.sale_price,
        })),
      });

      toast.success("Venda registrada com sucesso!");
      
      // Reset form
      setSelectedProducts([]);
      setProductSaleTotal(0);
      setPaymentMethod("");
      setNotes("");
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      toast.error("Erro ao registrar venda");
    }
  };

  const handleClose = () => {
    // Reset form on close
    setSelectedProducts([]);
    setProductSaleTotal(0);
    setPaymentMethod("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lançar Venda de Produtos
          </DialogTitle>
          <DialogDescription>
            Registrar venda de produtos para <strong>{patientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient info (read-only) */}
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-xs text-muted-foreground">Paciente</Label>
            <p className="font-medium">{patientName}</p>
          </div>

          {/* Product Selector */}
          <ProductSaleSelector
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
            onTotalChange={handleProductTotalChange}
            onValidationChange={handleValidationChange}
            disabled={createSale.isPending}
          />

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Forma de Pagamento</Label>
            <Select 
              value={paymentMethod} 
              onValueChange={setPaymentMethod}
              disabled={createSale.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre a venda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={createSale.isPending}
            />
          </div>

          {/* Total */}
          {selectedProducts.length > 0 && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total da Venda</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(productSaleTotal)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={createSale.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit || createSale.isPending}
          >
            {createSale.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Venda"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
