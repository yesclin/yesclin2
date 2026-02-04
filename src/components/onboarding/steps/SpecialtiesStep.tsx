import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Plus,
  Check,
  AlertCircle,
  Search,
  Loader2,
  Sparkles,
  Brain,
  Apple,
  Activity,
  Smile,
  Scissors,
  Baby,
  Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Curated list of officially supported specialties
const CURATED_SPECIALTIES = [
  {
    id: "clinica-geral",
    name: "Clínica Geral",
    description: "Atendimento médico generalista",
    icon: Stethoscope,
    color: "bg-blue-500",
  },
  {
    id: "psicologia",
    name: "Psicologia",
    description: "Saúde mental e terapia",
    icon: Brain,
    color: "bg-purple-500",
  },
  {
    id: "nutricao",
    name: "Nutrição",
    description: "Alimentação e dieta",
    icon: Apple,
    color: "bg-green-500",
  },
  {
    id: "fisioterapia",
    name: "Fisioterapia",
    description: "Reabilitação e movimento",
    icon: Activity,
    color: "bg-orange-500",
  },
  {
    id: "pilates",
    name: "Pilates",
    description: "Exercícios terapêuticos",
    icon: Activity,
    color: "bg-teal-500",
  },
  {
    id: "estetica",
    name: "Estética / Harmonização Facial",
    description: "Procedimentos estéticos",
    icon: Scissors,
    color: "bg-pink-500",
  },
  {
    id: "odontologia",
    name: "Odontologia",
    description: "Saúde bucal com odontograma digital",
    icon: Smile,
    color: "bg-cyan-500",
  },
  {
    id: "dermatologia",
    name: "Dermatologia",
    description: "Cuidados com a pele",
    icon: Heart,
    color: "bg-rose-500",
  },
  {
    id: "pediatria",
    name: "Pediatria",
    description: "Atendimento infantil",
    icon: Baby,
    color: "bg-amber-500",
  },
];

interface SpecialtiesStepProps {
  clinicId: string;
  onNext: () => void;
  onBack: () => void;
}

export function SpecialtiesStep({ clinicId, onNext, onBack }: SpecialtiesStepProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customSpecialties, setCustomSpecialties] = useState<Array<{ id: string; name: string }>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSpecialtyName, setNewSpecialtyName] = useState("");
  const [newSpecialtyDescription, setNewSpecialtyDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Filter curated specialties by search term
  const filteredSpecialties = CURATED_SPECIALTIES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter custom specialties by search term
  const filteredCustom = customSpecialties.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSpecialty = (id: string) => {
    setSelectedId(id);
  };

  const handleCreateCustomSpecialty = async () => {
    if (!newSpecialtyName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome da especialidade.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    const isDuplicate =
      CURATED_SPECIALTIES.some(
        (s) => s.name.toLowerCase() === newSpecialtyName.trim().toLowerCase()
      ) ||
      customSpecialties.some(
        (s) => s.name.toLowerCase() === newSpecialtyName.trim().toLowerCase()
      );

    if (isDuplicate) {
      toast({
        title: "Especialidade já existe",
        description: "Escolha um nome diferente.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create custom specialty in database
      const { data: newSpecialty, error } = await supabase
        .from("specialties")
        .insert({
          name: newSpecialtyName.trim(),
          description: newSpecialtyDescription.trim() || null,
          area: "Personalizada",
          clinic_id: clinicId,
          specialty_type: "personalizada",
          is_active: true,
        })
        .select("id, name")
        .single();

      if (error) throw error;

      if (newSpecialty) {
        // Add to local state and auto-select
        setCustomSpecialties((prev) => [...prev, newSpecialty]);
        setSelectedId(`custom-${newSpecialty.id}`);

        // Enable core modules for this specialty
        await enableCoreModules(newSpecialty.id);
      }

      toast({
        title: "Especialidade criada!",
        description: `"${newSpecialtyName}" foi adicionada e selecionada.`,
      });

      setNewSpecialtyName("");
      setNewSpecialtyDescription("");
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Error creating specialty:", err);
      toast({
        title: "Erro ao criar especialidade",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const enableCoreModules = async (specialtyId: string) => {
    try {
      const { data: coreModules } = await supabase
        .from("clinical_modules")
        .select("id")
        .in("key", ["evolucao", "anamnese", "alertas", "files"]);

      if (coreModules && coreModules.length > 0) {
        const moduleInserts = coreModules.map((m) => ({
          clinic_id: clinicId,
          specialty_id: specialtyId,
          module_id: m.id,
          is_enabled: true,
        }));

        await supabase
          .from("clinic_specialty_modules")
          .upsert(moduleInserts, { onConflict: "clinic_id,specialty_id,module_id" });
      }
    } catch (err) {
      console.error("Error enabling core modules:", err);
    }
  };

  const handleSaveAndContinue = async () => {
    // STEP A: Validate selection
    if (!selectedId) {
      toast({
        title: "Selecione uma especialidade",
        description: "Selecione uma especialidade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let persistedSpecialtyId: string | null = null;

      // Determine the specialty to persist
      const curatedSpecialty = CURATED_SPECIALTIES.find((s) => s.id === selectedId);
      
      if (curatedSpecialty) {
        // Check if curated specialty already exists for this clinic
        const { data: existing } = await supabase
          .from("specialties")
          .select("id")
          .eq("clinic_id", clinicId)
          .eq("name", curatedSpecialty.name)
          .maybeSingle();

        if (existing) {
          persistedSpecialtyId = existing.id;
          // Make sure it's active
          await supabase
            .from("specialties")
            .update({ is_active: true })
            .eq("id", existing.id);
        } else {
          // Create the specialty record
          const { data: created, error } = await supabase
            .from("specialties")
            .insert({
              name: curatedSpecialty.name,
              description: curatedSpecialty.description,
              area: "Padrão",
              clinic_id: clinicId,
              specialty_type: "padrao",
              is_active: true,
            })
            .select("id")
            .single();

          if (error) throw error;
          
          if (created) {
            persistedSpecialtyId = created.id;
            await enableCoreModules(created.id);
          }
        }
      } else if (selectedId.startsWith("custom-")) {
        // Custom specialty - extract the real UUID
        persistedSpecialtyId = selectedId.replace("custom-", "");
        // Ensure it's active
        await supabase
          .from("specialties")
          .update({ is_active: true })
          .eq("id", persistedSpecialtyId);
      }

      // Validate we have a specialty ID
      if (!persistedSpecialtyId) {
        throw new Error("Não foi possível obter o ID da especialidade.");
      }

      // STEP B: Save primary_specialty_id on clinic (CANONICAL FIELD)
      const { error: updateError } = await supabase
        .from("clinics")
        .update({ primary_specialty_id: persistedSpecialtyId })
        .eq("id", clinicId);

      if (updateError) {
        throw new Error("Erro ao salvar especialidade. Tente novamente.");
      }

      // STEP C: Confirm persistence by re-reading
      const { data: verifyClinic, error: verifyError } = await supabase
        .from("clinics")
        .select("primary_specialty_id")
        .eq("id", clinicId)
        .single();

      if (verifyError || verifyClinic?.primary_specialty_id !== persistedSpecialtyId) {
        throw new Error("Erro ao confirmar salvamento. Tente novamente.");
      }

      toast({
        title: "Especialidade configurada!",
        description: "Especialidade principal definida com sucesso.",
      });

      // STEP D: Navigate to next step (with fallback)
      try {
        onNext();
      } catch (navError) {
        console.error("Navigation error, applying fallback:", navError);
        toast({
          title: "Onboarding pendente",
          description: "Finalize a configuração em Configurações → Clínica.",
          variant: "default",
          duration: 10000,
        });
      }
    } catch (err) {
      console.error("Error saving specialty:", err);
      const errorMessage = err instanceof Error ? err.message : "Tente novamente.";
      toast({
        title: "Erro ao salvar especialidade",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    // Skipping should still show a warning but allow navigation
    toast({
      title: "Etapa pulada",
      description: "Configure especialidades em Configurações → Clínica para habilitar todos os recursos.",
      variant: "default",
      duration: 8000,
    });
    
    try {
      onNext();
    } catch (navError) {
      console.error("Navigation error on skip:", navError);
      toast({
        title: "Onboarding pendente",
        description: "Finalize a configuração em Configurações → Clínica.",
        variant: "default",
        duration: 10000,
      });
    }
  };

  const hasSelection = selectedId !== null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Especialidades da Clínica</h2>
          <p className="text-sm text-muted-foreground">
            Selecione as especialidades que sua clínica oferece
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          As especialidades definem os modelos de prontuário, procedimentos e fluxos de atendimento
          disponíveis no sistema.
        </AlertDescription>
      </Alert>

      {/* Selected indicator */}
      {hasSelection && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            1 especialidade selecionada
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar especialidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Curated Specialties Grid */}
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSpecialties.map((specialty) => {
            const isSelected = selectedId === specialty.id;
            const Icon = specialty.icon;

            return (
              <div
                key={specialty.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-md ring-2 ring-primary/30"
                    : "bg-card border-border hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm"
                }`}
                onClick={() => handleSelectSpecialty(specialty.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectSpecialty(specialty.id);
                  }
                }}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <div
                  className={`w-9 h-9 rounded-lg ${specialty.color} flex items-center justify-center shrink-0 transition-transform ${isSelected ? "scale-110" : ""}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`font-medium text-sm block ${isSelected ? "text-primary" : ""}`}>{specialty.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{specialty.description}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Specialties */}
        {filteredCustom.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Personalizadas</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustom.map((specialty) => {
                const customId = `custom-${specialty.id}`;
                const isSelected = selectedId === customId;

                return (
                    <div
                      key={customId}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-md ring-2 ring-primary/30"
                          : "bg-card border-border hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm"
                      }`}
                      onClick={() => handleSelectSpecialty(customId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectSpecialty(customId);
                        }
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 transition-transform ${isSelected ? "scale-110 bg-primary/20" : ""}`}>
                        <Sparkles className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium text-sm block ${isSelected ? "text-primary" : ""}`}>{specialty.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Personalizada</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Custom Button */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <span className="font-medium text-sm">Especialidade Personalizada</span>
            <p className="text-xs text-muted-foreground">
              Crie uma especialidade exclusiva para sua clínica
            </p>
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {!hasSelection && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione uma especialidade para continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Pular etapa
          </Button>
          <Button onClick={handleSaveAndContinue} disabled={isSaving || !hasSelection}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Create Custom Specialty Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Nova Especialidade Personalizada
            </DialogTitle>
            <DialogDescription>
              Crie uma especialidade exclusiva para sua clínica. Ela será configurada com um modelo
              básico de prontuário e fluxo de atendimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="specialty-name">
                Nome da Especialidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="specialty-name"
                placeholder="Ex: Acupuntura, Quiropraxia..."
                value={newSpecialtyName}
                onChange={(e) => setNewSpecialtyName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty-description">Descrição (opcional)</Label>
              <Input
                id="specialty-description"
                placeholder="Breve descrição da especialidade"
                value={newSpecialtyDescription}
                onChange={(e) => setNewSpecialtyDescription(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground">
                💡 A especialidade será criada com <strong>modelo básico de prontuário</strong>{" "}
                (anamnese, evolução) e <strong>fluxo básico de atendimento</strong>. Você pode
                personalizar depois em Configurações.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCustomSpecialty}
              disabled={isCreating || !newSpecialtyName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar e Selecionar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
