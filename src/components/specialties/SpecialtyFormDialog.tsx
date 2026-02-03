import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";

interface SpecialtyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  onSuccess?: (specialty: { id: string; name: string; area?: string; description?: string }) => void;
}

export function SpecialtyFormDialog({
  open,
  onOpenChange,
  clinicId,
  onSuccess,
}: SpecialtyFormDialogProps) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setArea("");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("O nome da especialidade é obrigatório");
      return;
    }

    if (!clinicId) {
      toast.error("Erro: clínica não identificada");
      return;
    }

    setIsSaving(true);

    const { data, error } = await supabase
      .from("specialties")
      .insert({
        clinic_id: clinicId,
        name: name.trim(),
        area: area.trim() || null,
        description: description.trim() || null,
        is_active: true,
      })
      .select("id, name, area, description")
      .single();

    setIsSaving(false);

    if (error) {
      console.error("Error creating specialty:", error);
      toast.error("Erro ao criar especialidade");
      return;
    }

    toast.success(`Especialidade "${data.name}" criada com sucesso!`);
    resetForm();
    onOpenChange(false);
    onSuccess?.(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Nova Especialidade
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="specialty-name">
              Nome da Especialidade <span className="text-destructive">*</span>
            </Label>
            <Input
              id="specialty-name"
              placeholder="Ex: Dermatologia, Pediatria, Fisioterapia..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty-area">Área (opcional)</Label>
            <Input
              id="specialty-area"
              placeholder="Ex: Saúde Mental, Estética, Reabilitação..."
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Agrupe especialidades por área para melhor organização
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty-description">Observação Interna (opcional)</Label>
            <Textarea
              id="specialty-description"
              placeholder="Notas internas sobre esta especialidade..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Criando..." : "Criar Especialidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
