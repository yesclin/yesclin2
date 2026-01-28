import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProceduresStepProps {
  clinicId: string;
  onNext: () => void;
  onBack: () => void;
}

interface Procedure {
  id?: string;
  name: string;
  duration_minutes: number;
  price: number;
  allow_return: boolean;
  return_days: number;
  isNew?: boolean;
}

export function ProceduresStep({ clinicId, onNext, onBack }: ProceduresStepProps) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadProcedures() {
      setIsLoading(true);
      const { data } = await supabase
        .from("procedures")
        .select("id, name, duration_minutes, price, return_days")
        .eq("clinic_id", clinicId)
        .eq("is_active", true);

      if (data && data.length > 0) {
        setProcedures(data.map(p => ({ 
          id: p.id,
          name: p.name,
          duration_minutes: p.duration_minutes || 30,
          price: Number(p.price) || 0,
          allow_return: true,
          return_days: p.return_days || 30,
          isNew: false 
        })));
      }
      setIsLoading(false);
    }

    if (clinicId) {
      loadProcedures();
    }
  }, [clinicId]);

  const addProcedure = () => {
    setProcedures([
      ...procedures,
      {
        name: "",
        duration_minutes: 30,
        price: 0,
        allow_return: true,
        return_days: 30,
        isNew: true,
      },
    ]);
  };

  const updateProcedure = (index: number, field: keyof Procedure, value: any) => {
    const updated = [...procedures];
    updated[index] = { ...updated[index], [field]: value };
    setProcedures(updated);
  };

  const removeProcedure = (index: number) => {
    setProcedures(procedures.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const newProcedures = procedures.filter(p => p.isNew && p.name.trim());

    if (newProcedures.length === 0) {
      onNext();
      return;
    }

    setIsSaving(true);

    for (const proc of newProcedures) {
      const { error } = await supabase.from("procedures").insert({
        clinic_id: clinicId,
        name: proc.name,
        duration_minutes: proc.duration_minutes,
        price: proc.price,
        allow_return: proc.allow_return,
        return_days: proc.return_days,
      });

      if (error) {
        toast({
          title: "Erro ao cadastrar",
          description: `Não foi possível cadastrar ${proc.name}.`,
          variant: "destructive",
        });
      }
    }

    setIsSaving(false);

    toast({
      title: "Procedimentos cadastrados!",
      description: `${newProcedures.length} procedimento(s) adicionado(s).`,
    });

    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Procedimentos</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os principais procedimentos e valores
          </p>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {procedures.map((proc, index) => (
          <motion.div
            key={proc.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-lg bg-muted/30 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 grid gap-2">
                <Label>Nome do Procedimento</Label>
                <Input
                  value={proc.name}
                  onChange={(e) => updateProcedure(index, "name", e.target.value)}
                  placeholder="Ex: Consulta Geral"
                  disabled={!proc.isNew}
                />
              </div>
              {proc.isNew && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProcedure(index)}
                  className="text-destructive hover:text-destructive mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={proc.duration_minutes}
                  onChange={(e) => updateProcedure(index, "duration_minutes", parseInt(e.target.value) || 30)}
                  disabled={!proc.isNew}
                />
              </div>
              <div className="grid gap-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={proc.price}
                  onChange={(e) => updateProcedure(index, "price", parseFloat(e.target.value) || 0)}
                  disabled={!proc.isNew}
                />
              </div>
            </div>

            {proc.isNew && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={proc.allow_return}
                    onCheckedChange={(checked) => updateProcedure(index, "allow_return", checked)}
                  />
                  <Label className="font-normal">Permite retorno gratuito</Label>
                </div>
                {proc.allow_return && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      value={proc.return_days}
                      onChange={(e) => updateProcedure(index, "return_days", parseInt(e.target.value) || 30)}
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        <Button variant="outline" onClick={addProcedure} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Procedimento
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext}>
            Pular etapa
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
