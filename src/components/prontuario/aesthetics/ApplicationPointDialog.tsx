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
 import { Textarea } from "@/components/ui/textarea";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Trash2 } from "lucide-react";
 import type { FacialMapApplication, ProcedureType, SideType } from "./types";
 import { 
   PROCEDURE_TYPE_LABELS, 
   SIDE_LABELS, 
   FACIAL_MUSCLES, 
   COMMON_PRODUCTS 
 } from "./types";
 
 interface ApplicationPointDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   point?: Partial<FacialMapApplication> | null;
   onSave: (data: Partial<FacialMapApplication>) => void;
   onDelete?: () => void;
   isNew?: boolean;
 }
 
 export function ApplicationPointDialog({
   open,
   onOpenChange,
   point,
   onSave,
   onDelete,
   isNew = false,
 }: ApplicationPointDialogProps) {
   const [formData, setFormData] = useState<Partial<FacialMapApplication>>({
     procedure_type: 'toxin',
     product_name: '',
     quantity: 0,
     unit: 'UI',
     muscle: '',
     side: 'bilateral',
     notes: '',
   });
 
   useEffect(() => {
     if (point) {
       setFormData({
         procedure_type: point.procedure_type || 'toxin',
         product_name: point.product_name || '',
         quantity: point.quantity || 0,
         unit: point.unit || 'UI',
         muscle: point.muscle || '',
         side: point.side || 'bilateral',
         notes: point.notes || '',
         position_x: point.position_x,
         position_y: point.position_y,
         view_type: point.view_type,
       });
     }
   }, [point]);
 
   const handleSave = () => {
     if (!formData.product_name || formData.quantity === 0) return;
     onSave(formData);
     onOpenChange(false);
   };
 
   const products = COMMON_PRODUCTS[formData.procedure_type as ProcedureType] || [];
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle>
             {isNew ? 'Novo Ponto de Aplicação' : 'Editar Ponto'}
           </DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4">
           <div className="space-y-2">
             <Label>Tipo de Procedimento</Label>
             <Select
               value={formData.procedure_type}
               onValueChange={(v) => setFormData({ ...formData, procedure_type: v as ProcedureType, product_name: '' })}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {Object.entries(PROCEDURE_TYPE_LABELS).map(([key, label]) => (
                   <SelectItem key={key} value={key}>{label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Produto</Label>
             <Select
               value={formData.product_name}
               onValueChange={(v) => setFormData({ ...formData, product_name: v })}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Selecione o produto" />
               </SelectTrigger>
               <SelectContent>
                 {products.map((product) => (
                   <SelectItem key={product} value={product}>{product}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {formData.procedure_type === 'toxin' && (
             <div className="space-y-2">
               <Label>Músculo</Label>
               <Select
                 value={formData.muscle || ''}
                 onValueChange={(v) => setFormData({ ...formData, muscle: v })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o músculo" />
                 </SelectTrigger>
                 <SelectContent>
                   {FACIAL_MUSCLES.map((muscle) => (
                     <SelectItem key={muscle.id} value={muscle.id}>
                       {muscle.name} ({muscle.region})
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Quantidade</Label>
               <Input
                 type="number"
                 value={formData.quantity}
                 onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                 min="0"
                 step="0.5"
               />
             </div>
             <div className="space-y-2">
               <Label>Unidade</Label>
               <Select
                 value={formData.unit}
                 onValueChange={(v) => setFormData({ ...formData, unit: v })}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="UI">UI</SelectItem>
                   <SelectItem value="ml">ml</SelectItem>
                   <SelectItem value="mg">mg</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           <div className="space-y-2">
             <Label>Lado</Label>
             <Select
               value={formData.side || 'bilateral'}
               onValueChange={(v) => setFormData({ ...formData, side: v as SideType })}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {Object.entries(SIDE_LABELS).map(([key, label]) => (
                   <SelectItem key={key} value={key}>{label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Observações</Label>
             <Textarea
               value={formData.notes || ''}
               onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
               placeholder="Observações adicionais..."
               rows={3}
             />
           </div>
         </div>
 
         <DialogFooter className="flex justify-between">
           {!isNew && onDelete && (
             <Button variant="destructive" size="sm" onClick={onDelete}>
               <Trash2 className="h-4 w-4 mr-1" />
               Excluir
             </Button>
           )}
           <div className="flex gap-2 ml-auto">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Cancelar
             </Button>
             <Button onClick={handleSave} disabled={!formData.product_name || formData.quantity === 0}>
               Salvar
             </Button>
           </div>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }