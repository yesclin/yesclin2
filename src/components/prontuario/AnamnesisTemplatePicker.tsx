import { useState, useCallback, useEffect } from "react";
import { Lock, FileText, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResolvedTemplate, TemplateOption } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";

interface AnamnesisTemplatePickerProps {
  /** The auto-resolved template (procedure → default → fallback) */
  resolvedTemplate: ResolvedTemplate | null;
  /** All active templates for the specialty */
  allTemplates: TemplateOption[];
  /** Whether multiple templates are available */
  hasMultipleTemplates: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Whether the user has started filling the form */
  hasStartedFilling: boolean;
  /** Callback when a template is selected */
  onTemplateChange: (templateId: string) => void;
  /** Currently selected template ID */
  selectedTemplateId: string | null;
}

/**
 * Smart template picker for anamnesis:
 * - If only 1 template exists: auto-loads, no selector shown
 * - If multiple exist: shows a dropdown, pre-selects the resolved default
 * - After filling starts: locks selection with a visual indicator
 */
export function AnamnesisTemplatePicker({
  resolvedTemplate,
  allTemplates,
  hasMultipleTemplates,
  isLoading,
  hasStartedFilling,
  onTemplateChange,
  selectedTemplateId,
}: AnamnesisTemplatePickerProps) {
  // Auto-select on mount when only 1 template or resolved template available
  useEffect(() => {
    if (!selectedTemplateId && resolvedTemplate?.id) {
      onTemplateChange(resolvedTemplate.id);
    }
  }, [resolvedTemplate?.id, selectedTemplateId, onTemplateChange]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <FileText className="h-4 w-4" />
        <span>Carregando modelo...</span>
      </div>
    );
  }

  if (!resolvedTemplate || allTemplates.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <FileText className="h-4 w-4" />
        <span>Nenhum modelo de anamnese disponível para esta especialidade.</span>
      </div>
    );
  }

  // Single template — no selector needed
  if (!hasMultipleTemplates) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span className="font-medium">{resolvedTemplate.name}</span>
        {resolvedTemplate.version_number && (
          <Badge variant="outline" className="text-[10px]">
            v{resolvedTemplate.version_number}
          </Badge>
        )}
      </div>
    );
  }

  // Multiple templates — show selector or locked indicator
  if (hasStartedFilling) {
    const selectedName =
      allTemplates.find((t) => t.id === selectedTemplateId)?.name ||
      resolvedTemplate.name;

    return (
      <div className="flex items-center gap-2 text-sm">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{selectedName}</span>
        <Badge variant="secondary" className="text-[10px]">
          Bloqueado
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Select
        value={selectedTemplateId || resolvedTemplate.id}
        onValueChange={onTemplateChange}
      >
        <SelectTrigger className="w-[280px] h-9">
          <SelectValue placeholder="Selecionar modelo de anamnese" />
        </SelectTrigger>
        <SelectContent>
          {allTemplates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <span>{t.name}</span>
                {t.is_default && (
                  <Badge variant="outline" className="text-[10px] ml-1">
                    Padrão
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
