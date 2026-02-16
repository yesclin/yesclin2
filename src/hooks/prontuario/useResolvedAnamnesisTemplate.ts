import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import type { Json } from "@/integrations/supabase/types";

export interface ResolvedTemplate {
  id: string;
  name: string;
  description: string | null;
  specialty_id: string | null;
  procedure_id: string | null;
  is_default: boolean;
  is_system: boolean;
  current_version_id: string | null;
  campos: Json;
  /** The resolved structure from the current version (preferred over campos) */
  structure: Json;
  version_number: number | null;
  /** How the template was resolved */
  resolution: "procedure" | "default" | "fallback";
}

/**
 * Resolves the correct anamnesis template for an active appointment.
 *
 * Priority:
 * 1. Template linked to the appointment's procedure_id (procedure-specific)
 * 2. Default template for the specialty (is_default = true)
 * 3. First active template for the specialty (fallback)
 *
 * Returns null only if no template exists at all for the specialty.
 * This hook ensures the medical record never opens empty.
 */
export function useResolvedAnamnesisTemplate(
  specialtyId: string | null | undefined,
  procedureId: string | null | undefined
) {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["resolved-anamnesis-template", clinic?.id, specialtyId, procedureId],
    queryFn: async (): Promise<ResolvedTemplate | null> => {
      if (!clinic?.id || !specialtyId) return null;

      // Fetch all active templates for this specialty in one query
      const { data: templates, error } = await supabase
        .from("anamnesis_templates")
        .select("id, name, description, specialty_id, procedure_id, is_default, is_system, current_version_id, campos")
        .eq("specialty_id", specialtyId)
        .eq("is_active", true)
        .eq("archived", false)
        .or(`clinic_id.eq.${clinic.id},clinic_id.is.null`)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching templates for resolution:", error);
        return null;
      }

      if (!templates || templates.length === 0) return null;

      // 1. Procedure-specific template
      let resolved = procedureId
        ? templates.find((t) => t.procedure_id === procedureId)
        : undefined;
      let resolution: ResolvedTemplate["resolution"] = "procedure";

      // 2. Default template for specialty
      if (!resolved) {
        resolved = templates.find((t) => t.is_default);
        resolution = "default";
      }

      // 3. Fallback: first active template
      if (!resolved) {
        resolved = templates[0];
        resolution = "fallback";
      }

      // Load the version structure
      let structure: Json = resolved.campos || [];
      let versionNumber: number | null = null;

      if (resolved.current_version_id) {
        const { data: ver } = await supabase
          .from("anamnesis_template_versions")
          .select("structure, version_number")
          .eq("id", resolved.current_version_id)
          .single();

        if (ver) {
          structure = ver.structure;
          versionNumber = ver.version_number;
        }
      }

      return {
        id: resolved.id,
        name: resolved.name,
        description: resolved.description,
        specialty_id: resolved.specialty_id,
        procedure_id: resolved.procedure_id,
        is_default: resolved.is_default,
        is_system: resolved.is_system,
        current_version_id: resolved.current_version_id,
        campos: resolved.campos,
        structure,
        version_number: versionNumber,
        resolution,
      };
    },
    enabled: !!clinic?.id && !!specialtyId,
    staleTime: 60_000,
  });
}
