import { useEnabledSpecialties } from "@/hooks/useEnabledSpecialties";
import { Badge } from "@/components/ui/badge";
import { Stethoscope } from "lucide-react";
import { filterOfficialSpecialties } from "@/constants/officialSpecialties";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Badge global que exibe as especialidades ativas da clínica.
 * Visível no header de todas as telas do app.
 */
export function ActiveSpecialtiesBadge() {
  const { data: rawSpecialties = [], isLoading } = useEnabledSpecialties();
  const specialties = filterOfficialSpecialties(rawSpecialties);

  if (isLoading || specialties.length === 0) return null;

  const displayNames = specialties.slice(0, 3).map((s) => s.name);
  const remaining = specialties.length - 3;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden md:flex items-center gap-1.5 ml-auto print:hidden">
          <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1">
            {displayNames.map((name) => (
              <Badge
                key={name}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-medium"
              >
                {name}
              </Badge>
            ))}
            {remaining > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 font-medium"
              >
                +{remaining}
              </Badge>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="font-semibold text-xs mb-1">Especialidades ativas:</p>
        <ul className="text-xs space-y-0.5">
          {specialties.map((s) => (
            <li key={s.id}>• {s.name}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
