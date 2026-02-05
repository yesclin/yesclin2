 import { useState, useEffect } from "react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
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
 import { Trash2 } from "lucide-react";
 import type { FacialMapApplication, ProcedureType } from "./types";
 import { PROCEDURE_TYPE_LABELS, COMMON_PRODUCTS, FACIAL_MUSCLES } from "./types";
 
 interface ApplicationPointDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   point?: Partial<FacialMapApplication> | null;
   onSave: (data: Partial<FacialMapApplication>) => void;
   onDelete?: () => void;
   isNew?: boolean;
   preselectedMuscle?: string | null;
   preselectedProduct?: string | null;
   preselectedType?: ProcedureType;
 }
 
 export function ApplicationPointDialog({
   open,
   onOpenChange,
   point,
   onSave,
   onDelete,
   isNew = false,
   preselectedMuscle,
   preselectedProduct,
   preselectedType = 'toxin',
 }: ApplicationPointDialogProps) {
   const [quantity, setQuantity] = useState<number>(0);
   const [unit, setUnit] = useState<string>('UI');
   const [procedureType, setProcedureType] = useState<ProcedureType>(preselectedType);
   const [productName, setProductName] = useState<string>(preselectedProduct || '');
   const [muscle, setMuscle] = useState<string>(preselectedMuscle || '');
 
   useEffect(() => {
     if (point) {
       setQuantity(point.quantity || 0);
       setUnit(point.unit || 'UI');
       setProcedureType((point.procedure_type as ProcedureType) || preselectedType);
       setProductName(point.product_name || preselectedProduct || '');
       setMuscle(point.muscle || preselectedMuscle || '');
     } else {
       // Reset for new point
       setQuantity(0);
       setUnit(preselectedType === 'toxin' ? 'UI' : 'ml');
       setProcedureType(preselectedType);
       setProductName(preselectedProduct || '');
       setMuscle(preselectedMuscle || '');
     }
   }, [point, preselectedMuscle, preselectedProduct, preselectedType]);
 
   const handleSave = () => {
     if (quantity <= 0 || !productName) return;
     onSave({
       ...point,
       procedure_type: procedureType,
       product_name: productName,
       quantity,
       unit,
       muscle: muscle || null,
     });
     onOpenChange(false);
   };
 
   const muscleName = FACIAL_MUSCLES.find(m => m.id === muscle)?.name || muscle;
   const products = COMMON_PRODUCTS[procedureType] || [];
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-sm">
         <DialogHeader>
           <DialogTitle className="text-base font-medium">
             {isNew ? 'Registrar Aplicação' : 'Editar Ponto'}
           </DialogTitle>
           {isNew && muscleName && (
             <p className="text-sm text-muted-foreground mt-1">
               Músculo: <span className="font-medium text-foreground">{muscleName}</span>
             </p>
           )}
         </DialogHeader>
 
         <div className="space-y-4 py-2">
           {/* Procedure Type - only show if new and no preselection */}
           {isNew && !preselectedType && (
             <div className="space-y-2">
               <Label className="text-xs text-muted-foreground">Tipo</Label>
               <Select
                 value={procedureType}
                 onValueChange={(v) => {
                   setProcedureType(v as ProcedureType);
                   setProductName('');
                   setUnit(v === 'toxin' ? 'UI' : 'ml');
                 }}
               >
                 <SelectTrigger className="h-9">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {Object.entries(PROCEDURE_TYPE_LABELS).map(([key, label]) => (
                     <SelectItem key={key} value={key}>{label}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}
 
           {/* Product */}
           <div className="space-y-2">
             <Label className="text-xs text-muted-foreground">Produto</Label>
             <Select value={productName} onValueChange={setProductName}>
               <SelectTrigger className="h-9">
                 <SelectValue placeholder="Selecione" />
               </SelectTrigger>
               <SelectContent>
                 {products.map((product) => (
                   <SelectItem key={product} value={product}>{product}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Quantity */}
           <div className="space-y-2">
             <Label className="text-xs text-muted-foreground">
               Unidades {procedureType === 'toxin' ? '(UI)' : '(ml)'}
             </Label>
             <div className="flex gap-2">
               <Input
                 type="number"
                 value={quantity || ''}
                 onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                 min="0"
                 step={procedureType === 'toxin' ? '1' : '0.1'}
                 className="h-10 text-lg font-medium"
                 placeholder="0"
                 autoFocus
               />
             </div>
           </div>
         </div>
 
         <DialogFooter className="flex gap-2 sm:gap-2">
           {!isNew && onDelete && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={onDelete}
               className="text-destructive hover:text-destructive mr-auto"
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           )}
           <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
             Cancelar
           </Button>
           <Button 
             size="sm" 
             onClick={handleSave} 
             disabled={!productName || quantity <= 0}
           >
             Salvar
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }