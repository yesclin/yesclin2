import { useEnabledSpecialties } from "@/hooks/useEnabledSpecialties";
import { filterOfficialSpecialties } from "@/constants/officialSpecialties";
import { useGlobalSpecialty } from "@/hooks/useGlobalSpecialty";
import { Stethoscope, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Global specialty selector shown in the app header.
 * Displays the currently active specialty with a dropdown to switch.
 * 
 * RULE: Only ONE specialty is shown at a time — never a list of all.
 */
export function ActiveSpecialtiesBadge() {
  const { data: rawSpecialties = [], isLoading } = useEnabledSpecialties();
  const specialties = filterOfficialSpecialties(rawSpecialties);
  const { activeSpecialtyId, setActiveSpecialtyId } = useGlobalSpecialty();

  if (isLoading || specialties.length === 0) return null;

  const active = specialties.find((s) => s.id === activeSpecialtyId) || specialties[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hidden md:flex items-center gap-1.5 ml-auto px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors print:hidden">
          <Stethoscope className="h-3.5 w-3.5" />
          <span className="truncate max-w-[160px]">{active.name}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Especialidade ativa
        </div>
        {specialties.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setActiveSpecialtyId(s.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{s.name}</span>
            {s.id === active.id && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
