import { 
  Stethoscope, ChevronDown, Lock, Brain, Apple, Activity, 
  Sparkles, Smile, Scan, Baby, Dumbbell 
} from 'lucide-react';
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
import { YESCLIN_SPECIALTY_LABELS } from '@/hooks/prontuario/yesclinSpecialties';

// Icon mapping for specialties
const SPECIALTY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Brain,
  Apple,
  Activity,
  Dumbbell,
  Sparkles,
  Smile,
  Scan,
  Baby,
};

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
  const displayLabel = activeSpecialty?.name || YESCLIN_SPECIALTY_LABELS[activeSpecialtyKey] || 'Clínica Geral';
  const IconComponent = activeSpecialty?.icon 
    ? SPECIALTY_ICONS[activeSpecialty.icon] || Stethoscope 
    : Stethoscope;

  if (isFromAppointment) {
    // Locked to appointment specialty - show as badge
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
              <IconComponent className="h-4 w-4 text-primary" />
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

  // Single specialty enabled — show fixed label, no dropdown
  if (specialties.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
        <IconComponent className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{displayLabel}</span>
      </div>
    );
  }

  // Manual selection allowed - show dropdown with Yesclin specialties
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading || disabled}
        >
          <IconComponent className="h-4 w-4" />
          <span>{displayLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Selecione a especialidade para visualizar os blocos clínicos correspondentes
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Yesclin supported specialties */}
        {specialties.map((specialty) => {
          const SpecIcon = specialty.icon 
            ? SPECIALTY_ICONS[specialty.icon] || Stethoscope 
            : Stethoscope;
          const isActive = activeSpecialty?.key === specialty.key && 
                          activeSpecialty?.name === specialty.name;
          
          return (
            <DropdownMenuItem
              key={specialty.id}
              onClick={() => onSelect(specialty.key)}
              className="gap-2 cursor-pointer"
            >
              <SpecIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <span className="block truncate">{specialty.name}</span>
                {specialty.description && (
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {specialty.description}
                  </span>
                )}
              </div>
              {isActive && (
                <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">Ativo</Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
