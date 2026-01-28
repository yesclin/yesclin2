import { useState, useEffect } from "react";
import { Package, Minus, Plus, AlertTriangle, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/inventory";

export interface SelectedProduct {
  product: Product;
  quantity: number;
  stockError?: string; // Validation error for this item
}

export interface StockValidationError {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  message: string;
}

interface ProductSaleSelectorProps {
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
  onTotalChange: (total: number) => void;
  allowNegativeStock?: boolean;
  onValidationChange?: (errors: StockValidationError[]) => void;
}

export function ProductSaleSelector({
  selectedProducts,
  onProductsChange,
  onTotalChange,
  allowNegativeStock = false,
  onValidationChange,
}: ProductSaleSelectorProps) {
  const { data: products = [], isLoading } = useProducts(false); // Only active products
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // Validate stock and calculate total whenever selected products change
  useEffect(() => {
    const total = selectedProducts.reduce(
      (sum, item) => sum + item.product.sale_price * item.quantity,
      0
    );
    onTotalChange(total);

    // Validate stock for all selected products
    const errors: StockValidationError[] = [];
    const updatedProducts = selectedProducts.map(item => {
      const available = item.product.stock_quantity;
      if (item.quantity > available && !allowNegativeStock) {
        const error: StockValidationError = {
          productId: item.product.id,
          productName: item.product.name,
          requested: item.quantity,
          available,
          message: `Quantidade solicitada (${item.quantity}) excede o estoque disponível (${available})`,
        };
        errors.push(error);
        return { ...item, stockError: error.message };
      }
      return { ...item, stockError: undefined };
    });

    // Only update if there are changes to stockError
    const hasErrorChanges = updatedProducts.some(
      (updated, idx) => updated.stockError !== selectedProducts[idx].stockError
    );
    if (hasErrorChanges) {
      onProductsChange(updatedProducts);
    }

    onValidationChange?.(errors);
  }, [selectedProducts, onTotalChange, allowNegativeStock, onValidationChange]);

  const handleAddProduct = () => {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Check if product already exists in selection
    const existingIndex = selectedProducts.findIndex(
      (sp) => sp.product.id === selectedProductId
    );

    if (existingIndex >= 0) {
      // Update quantity
      const newProducts = [...selectedProducts];
      newProducts[existingIndex].quantity += quantity;
      onProductsChange(newProducts);
    } else {
      // Add new product
      onProductsChange([...selectedProducts, { product, quantity }]);
    }

    // Reset selection
    setSelectedProductId("");
    setQuantity(1);
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((sp) => sp.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const product = selectedProducts.find((sp) => sp.product.id === productId);
    if (!product) return;

    // If negative stock is not allowed, cap at available stock
    const maxAllowed = allowNegativeStock 
      ? Infinity 
      : product.product.stock_quantity;
    
    const finalQuantity = Math.min(newQuantity, maxAllowed);

    onProductsChange(
      selectedProducts.map((sp) =>
        sp.product.id === productId ? { ...sp, quantity: finalQuantity } : sp
      )
    );
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const maxQuantity = selectedProduct?.stock_quantity || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStockBadgeVariant = (stock: number, minStock: number) => {
    if (stock === 0) return "destructive";
    if (stock <= minStock) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          Selecionar Produtos
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Produto</Label>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem
                    key={product.id}
                    value={product.id}
                    disabled={product.stock_quantity === 0}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{product.name}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {formatCurrency(product.sale_price)}
                        </span>
                        <Badge
                          variant={getStockBadgeVariant(
                            product.stock_quantity,
                            product.min_stock_quantity
                          )}
                          className="text-xs"
                        >
                          {product.stock_quantity} em estoque
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1))
                      )
                    }
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {quantity >= maxQuantity && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Estoque máximo disponível
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Subtotal</Label>
                <div className="flex items-center h-9 px-3 border rounded-md bg-muted text-sm font-medium">
                  {formatCurrency(selectedProduct.sale_price * quantity)}
                </div>
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddProduct}
            disabled={!selectedProductId || quantity < 1}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {/* Selected Products List */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Produtos Selecionados</Label>
          <div className="divide-y border rounded-lg">
            {selectedProducts.map((item) => (
              <div
                key={item.product.id}
                className={`flex flex-col p-3 ${item.stockError ? 'bg-destructive/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.product.sale_price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleQuantityChange(item.product.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleQuantityChange(item.product.id, item.quantity + 1)
                        }
                        disabled={!allowNegativeStock && item.quantity >= item.product.stock_quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-medium text-sm w-24 text-right">
                      {formatCurrency(item.product.sale_price * item.quantity)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 px-2"
                      onClick={() => handleRemoveProduct(item.product.id)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
                {item.stockError && (
                  <div className="flex items-center gap-2 mt-2 text-destructive text-xs">
                    <XCircle className="h-3 w-3" />
                    <span>{item.stockError}</span>
                  </div>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-muted/50">
              <span className="font-medium">Total</span>
              <span className="font-bold text-lg">
                {formatCurrency(
                  selectedProducts.reduce(
                    (sum, item) => sum + item.product.sale_price * item.quantity,
                    0
                  )
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
