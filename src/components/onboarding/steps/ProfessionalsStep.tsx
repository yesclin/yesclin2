import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, ArrowRight, ArrowLeft, Plus, Trash2, Settings, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ClinicSpecialty {
  id: string;
  name: string;
}

interface ProfessionalsStepProps {
  clinicId: string;
  onNext: () => void;
  onBack: () => void;
}

interface Professional {
  id?: string;
  name: string;
  specialty: string;
  isNew?: boolean;
}

export function ProfessionalsStep({ clinicId, onNext, onBack }: ProfessionalsStepProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicSpecialties, setClinicSpecialties] = useState<ClinicSpecialty[]>([]);
  const { toast } = useToast();

  const loadClinicSpecialties = async () => {
    const { data } = await supabase
      .from("specialties")
      .select("id, name")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("name");
    
    if (data) {
      setClinicSpecialties(data);
    }
  };

  useEffect(() => {
    async function loadProfessionals() {
      setIsLoading(true);
      const { data } = await supabase
        .from("professionals")
        .select("id, full_name, specialty_id")
        .eq("clinic_id", clinicId)
        .eq("is_active", true);

      if (data && data.length > 0) {
        setProfessionals(data.map(p => ({ 
          id: p.id,
          name: p.full_name, 
          specialty: p.specialty_id || "",
          isNew: false 
        })));
      }
      setIsLoading(false);
    }

    if (clinicId) {
      loadProfessionals();
      loadClinicSpecialties();
    }
  }, [clinicId]);

  const addProfessional = () => {
    setProfessionals([
      ...professionals,
      { name: "", specialty: "", isNew: true },
    ]);
  };

  const updateProfessional = (index: number, field: keyof Professional, value: string) => {
    const updated = [...professionals];
    updated[index] = { ...updated[index], [field]: value };
    setProfessionals(updated);
  };

  const removeProfessional = (index: number) => {
    setProfessionals(professionals.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const newProfessionals = professionals.filter(p => p.isNew && p.name.trim());

    if (newProfessionals.length === 0) {
      onNext();
      return;
    }

    setIsSaving(true);

    for (const prof of newProfessionals) {
      const { error } = await supabase.from("professionals").insert({
        clinic_id: clinicId,
        full_name: prof.name,
      });

      if (error) {
        toast({
          title: "Erro ao cadastrar",
          description: `Não foi possível cadastrar ${prof.name}.`,
          variant: "destructive",
        });
      }
    }

    setIsSaving(false);

    toast({
      title: "Profissionais cadastrados!",
      description: `${newProfessionals.length} profissional(is) adicionado(s).`,
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
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Profissionais</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os profissionais que atendem na clínica
          </p>
        </div>
      </div>

      {/* No specialties warning */}
      {clinicSpecialties.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span>Nenhuma especialidade cadastrada ainda.</span>
            <p className="text-xs text-muted-foreground">
              Você pode continuar o onboarding e cadastrar especialidades depois em{" "}
              <Link to="/app/config/clinica" className="text-primary hover:underline inline-flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Configurações da Clínica
              </Link>
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {professionals.map((prof, index) => (
          <motion.div
            key={prof.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-end p-3 border rounded-lg bg-muted/30"
          >
            <div className="flex-1 grid gap-2">
              <Label>Nome</Label>
              <Input
                value={prof.name}
                onChange={(e) => updateProfessional(index, "name", e.target.value)}
                placeholder="Nome do profissional"
                disabled={!prof.isNew}
              />
            </div>
            <div className="flex-1 grid gap-2">
              <Label>Especialidade</Label>
              <Select
                value={prof.specialty}
                onValueChange={(value) => updateProfessional(index, "specialty", value)}
                disabled={!prof.isNew || clinicSpecialties.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={clinicSpecialties.length === 0 ? "Configure especialidades primeiro" : "Selecione"} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {clinicSpecialties.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {prof.isNew && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeProfessional(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        ))}

        <Button variant="outline" onClick={addProfessional} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Profissional
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
