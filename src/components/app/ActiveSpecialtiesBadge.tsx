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
 * 
 * RULES:
 * - Shows ONE active specialty at a time — never a list
 * - If only 1 specialty enabled → fixed label, no dropdown
 * - If multiple → dropdown to switch context
 */
export function ActiveSpecialtiesBadge() {
  const {
    activeSpecialty,
    enabledSpecialties,
    isSingleSpecialty,
    setActiveSpecialtyId,
  } = useGlobalSpecialty();

  if (!activeSpecialty) return null;

  // Single specialty: fixed label, no dropdown
  if (isSingleSpecialty) {
    return (
      <div className="hidden md:flex items-center gap-1.5 ml-auto px-2.5 py-1 text-xs font-medium text-muted-foreground print:hidden">
        <Stethoscope className="h-3.5 w-3.5" />
        <span className="truncate max-w-[160px]">{activeSpecialty.name}</span>
      </div>
    );
  }

  // Multiple specialties: dropdown selector
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hidden md:flex items-center gap-1.5 ml-auto px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors print:hidden">
          <Stethoscope className="h-3.5 w-3.5" />
          <span className="truncate max-w-[160px]">{activeSpecialty.name}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Especialidade ativa
        </div>
        {enabledSpecialties.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setActiveSpecialtyId(s.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{s.name}</span>
            {s.id === activeSpecialty.id && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
