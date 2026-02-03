import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SpecialtyFormDialog } from "@/components/specialties/SpecialtyFormDialog";

interface Specialty {
  id: string;
  name: string;
}

interface ProfessionalFieldsProps {
  professionalType: string;
  onProfessionalTypeChange: (value: string) => void;
  registrationNumber: string;
  onRegistrationNumberChange: (value: string) => void;
  selectedSpecialtyIds: string[];
  onToggleSpecialty: (specialtyId: string) => void;
  specialties: Specialty[];
  loadingSpecialties: boolean;
  clinicId?: string;
  onSpecialtyAdded?: () => void;
}

export const professionalTypeLabels: Record<string, string> = {
  medico: "Médico(a)",
  dentista: "Dentista",
  psicologo: "Psicólogo(a)",
  fisioterapeuta: "Fisioterapeuta",
  nutricionista: "Nutricionista",
  enfermeiro: "Enfermeiro(a)",
  esteticista: "Esteticista",
  outro: "Outro",
};

export function ProfessionalFields({
  professionalType,
  onProfessionalTypeChange,
  registrationNumber,
  onRegistrationNumberChange,
  selectedSpecialtyIds,
  onToggleSpecialty,
  specialties,
  loadingSpecialties,
  clinicId,
  onSpecialtyAdded,
}: ProfessionalFieldsProps) {
  const [isAddingSpecialty, setIsAddingSpecialty] = useState(false);

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/10">
      <div className="grid gap-2">
        <Label htmlFor="professionalType">Tipo de Profissional</Label>
        <Select value={professionalType} onValueChange={onProfessionalTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(professionalTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="registrationNumber">Registro Profissional (opcional)</Label>
        <Input
          id="registrationNumber"
          placeholder="Ex: CRM, CRO, CRP..."
          value={registrationNumber}
          onChange={(e) => onRegistrationNumberChange(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            Especialidade(s) *
            {loadingSpecialties && <Loader2 className="h-3 w-3 animate-spin" />}
          </Label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setIsAddingSpecialty(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Nova Especialidade
          </Button>
        </div>

        {/* Specialty Form Dialog */}
        {clinicId && (
          <SpecialtyFormDialog
            open={isAddingSpecialty}
            onOpenChange={setIsAddingSpecialty}
            clinicId={clinicId}
            onSuccess={() => {
              onSpecialtyAdded?.();
            }}
          />
        )}

        {specialties.length === 0 && !loadingSpecialties ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma especialidade cadastrada. Clique em "Nova Especialidade" para adicionar.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {specialties.map((specialty) => (
              <div
                key={specialty.id}
                className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors ${
                  selectedSpecialtyIds.includes(specialty.id)
                    ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700"
                    : "bg-background hover:bg-muted/50"
                }`}
                onClick={() => onToggleSpecialty(specialty.id)}
              >
                <Checkbox
                  id={`specialty-${specialty.id}`}
                  checked={selectedSpecialtyIds.includes(specialty.id)}
                  onCheckedChange={() => onToggleSpecialty(specialty.id)}
                />
                <Label
                  htmlFor={`specialty-${specialty.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {specialty.name}
                </Label>
              </div>
            ))}
          </div>
        )}

        {selectedSpecialtyIds.length === 0 && (
          <p className="text-xs text-destructive">Selecione pelo menos uma especialidade</p>
        )}
      </div>
    </div>
  );
}
