import { 
  Stethoscope, Lock, Brain, Apple, Activity, 
  Sparkles, Smile, Scan, Baby, Dumbbell 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SpecialtyOption, SpecialtyKey } from '@/hooks/prontuario/useActiveSpecialty';
import { YESCLIN_SPECIALTY_LABELS } from '@/hooks/prontuario/yesclinSpecialties';

// Icon mapping for specialties
const SPECIALTY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope, Brain, Apple, Activity, Dumbbell, Sparkles, Smile, Scan, Baby,
};

interface SpecialtySelectorProps {
  activeSpecialty: SpecialtyOption | null;
  activeSpecialtyKey: SpecialtyKey;
  isFromAppointment: boolean;
  loading?: boolean;
}

/**
 * Displays the active specialty as a fixed label.
 * The specialty is determined exclusively by Configurações > Clínica.
 * No manual selection is allowed.
 */
export function SpecialtySelector({
  activeSpecialty,
  activeSpecialtyKey,
  isFromAppointment,
}: SpecialtySelectorProps) {
  const displayLabel = activeSpecialty?.name || YESCLIN_SPECIALTY_LABELS[activeSpecialtyKey] || 'Clínica Geral';
  const IconComponent = activeSpecialty?.icon 
    ? SPECIALTY_ICONS[activeSpecialty.icon] || Stethoscope 
    : Stethoscope;

  if (isFromAppointment) {
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

  // Fixed label — no dropdown, no manual selection
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
            <IconComponent className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{displayLabel}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Especialidade definida em Configurações &gt; Clínica</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
