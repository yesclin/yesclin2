import { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/inventory";

export interface ProcedureProductItem {
  product_id: string;
  product_name: string;
  product_unit: string;
  quantity: number;
}

interface ProcedureProductsSectionProps {
  items: ProcedureProductItem[];
  onChange: (items: ProcedureProductItem[]) => void;
  disabled?: boolean;
}

export function ProcedureProductsSection({
  items,
  onChange,
  disabled = false,
}: ProcedureProductsSectionProps) {
  const { data: products = [], isLoading } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");

  // Filter out already added products
  const availableProducts = products.filter(
    (p) => !items.some((item) => item.product_id === p.id)
  );

  const handleAddProduct = () => {
    if (!selectedProductId || !quantity) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const newItem: ProcedureProductItem = {
      product_id: product.id,
      product_name: product.name,
      product_unit: product.unit,
      quantity: qty,
    };

    onChange([...items, newItem]);
    setSelectedProductId("");
    setQuantity("1");
  };

  const handleRemoveProduct = (productId: string) => {
    onChange(items.filter((item) => item.product_id !== productId));
  };

  const handleQuantityChange = (productId: string, newQuantity: string) => {
    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty <= 0) return;

    onChange(
      items.map((item) =>
        item.product_id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Materiais / Insumos Utilizados</Label>
      </div>

      {/* Add product form */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            disabled={disabled || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto..." />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  {items.length > 0
                    ? "Todos os produtos já foram adicionados"
                    : "Nenhum produto disponível"}
                </div>
              ) : (
                availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Qtd"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddProduct}
          disabled={disabled || !selectedProductId || !quantity}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Product list */}
      {items.length > 0 && (
        <div className="rounded-md border divide-y">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center justify-between p-3 gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product_name}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {item.product_unit}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-20 h-8 text-sm"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.product_id, e.target.value)
                  }
                  disabled={disabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveProduct(item.product_id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/20">
          Nenhum material vinculado. Adicione produtos do estoque para consumo automático.
        </p>
      )}
    </div>
  );
}
