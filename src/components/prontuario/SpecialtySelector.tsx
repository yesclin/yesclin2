import { useState } from 'react';
import { Stethoscope, ChevronDown, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SpecialtyOption, SpecialtyKey } from '@/hooks/prontuario/useActiveSpecialty';
import { SPECIALTY_LABELS } from '@/hooks/prontuario/specialtyTabsConfig';
import { SpecialtyFormDialog } from '@/components/specialties/SpecialtyFormDialog';
import { useClinicData } from '@/hooks/useClinicData';
import { useInvalidateSpecialties } from '@/hooks/useSpecialties';

interface SpecialtySelectorProps {
  activeSpecialty: SpecialtyOption | null;
  activeSpecialtyKey: SpecialtyKey;
  specialties: SpecialtyOption[];
  isFromAppointment: boolean;
  onSelect: (specialtyId: string | null) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SpecialtySelector({
  activeSpecialty,
  activeSpecialtyKey,
  specialties,
  isFromAppointment,
  onSelect,
  loading,
  disabled,
}: SpecialtySelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { clinic } = useClinicData();
  const invalidateSpecialties = useInvalidateSpecialties();
  
  const displayLabel = activeSpecialty?.name || SPECIALTY_LABELS[activeSpecialtyKey] || 'Clínica Geral';

  if (isFromAppointment) {
    // Locked to appointment specialty - show as badge
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{displayLabel}</span>
              <Lock className="h-3 w-3 text-primary/60" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Especialidade definida pelo atendimento ativo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Manual selection allowed
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={loading || disabled}
          >
            <Stethoscope className="h-4 w-4" />
            <span>{displayLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Selecione a especialidade para visualizar os blocos clínicos correspondentes
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Default option */}
          <DropdownMenuItem
            onClick={() => onSelect(null)}
            className="gap-2"
          >
            <Stethoscope className="h-4 w-4" />
            <span>Clínica Geral</span>
            {!activeSpecialty && (
              <Badge variant="secondary" className="ml-auto text-[10px]">Ativo</Badge>
            )}
          </DropdownMenuItem>
          
          {specialties.length > 0 && <DropdownMenuSeparator />}
          
          {/* Available specialties */}
          {specialties.map((specialty) => (
            <DropdownMenuItem
              key={specialty.id}
              onClick={() => onSelect(specialty.id)}
              className="gap-2"
            >
              <Stethoscope className="h-4 w-4" />
              <span>{specialty.name}</span>
              {activeSpecialty?.id === specialty.id && (
                <Badge variant="secondary" className="ml-auto text-[10px]">Ativo</Badge>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Create new specialty option */}
          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="gap-2 text-primary font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Criar nova especialidade</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Specialty Creation Dialog */}
      {clinic?.id && (
        <SpecialtyFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          clinicId={clinic.id}
          onSuccess={(newSpecialty) => {
            invalidateSpecialties();
            onSelect(newSpecialty.id);
          }}
        />
      )}
    </>
  );
}
