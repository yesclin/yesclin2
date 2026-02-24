import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface DynamicAnamnesisRecord {
  id: string;
  patient_id: string;
  clinic_id: string;
  template_id: string;
  template_version_id: string;
  specialty_id: string | null;
  procedure_id: string | null;
  appointment_id: string | null;
  responses: Record<string, unknown>;
  structure_snapshot: unknown;
  created_at: string;
  created_by: string | null;
  created_by_name?: string;
  template_name?: string;
}

export function useDynamicAnamnesisRecords(patientId: string | null) {
  const { clinic } = useClinicData();
  const [records, setRecords] = useState<DynamicAnamnesisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anamnesis_records')
        .select('*, anamnesis_templates(name)')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get creator names
      const creatorIds = [...new Set((data || []).map(r => r.created_by).filter(Boolean))] as string[];
      let creatorsMap: Record<string, string> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
        if (profiles) {
          creatorsMap = profiles.reduce((acc, p) => {
            if (p.user_id && p.full_name) acc[p.user_id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const mapped: DynamicAnamnesisRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        patient_id: r.patient_id,
        clinic_id: r.clinic_id,
        template_id: r.template_id,
        template_version_id: r.template_version_id,
        specialty_id: r.specialty_id,
        procedure_id: r.procedure_id,
        appointment_id: r.appointment_id,
        responses: (r.responses as Record<string, unknown>) || {},
        structure_snapshot: r.structure_snapshot,
        created_at: r.created_at,
        created_by: r.created_by,
        created_by_name: r.created_by ? creatorsMap[r.created_by] : undefined,
        template_name: r.anamnesis_templates?.name || undefined,
      }));

      setRecords(mapped);
    } catch (err) {
      console.error('Error fetching dynamic anamnesis records:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveRecord = useCallback(async (params: {
    templateId: string;
    templateVersionId: string;
    specialtyId?: string | null;
    procedureId?: string | null;
    appointmentId?: string | null;
    responses: Record<string, unknown>;
    structureSnapshot: unknown;
  }): Promise<string | null> => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return null;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('anamnesis_records')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          template_id: params.templateId,
          template_version_id: params.templateVersionId,
          specialty_id: params.specialtyId || null,
          procedure_id: params.procedureId || null,
          appointment_id: params.appointmentId || null,
          responses: params.responses as unknown as Json,
          structure_snapshot: params.structureSnapshot as unknown as Json,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Anamnese salva com sucesso');
      await fetchRecords();
      return data.id;
    } catch (err) {
      console.error('Error saving dynamic anamnesis:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar anamnese');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, fetchRecords]);

  const updateRecord = useCallback(async (
    id: string,
    responses: Record<string, unknown>
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('anamnesis_records')
        .update({ responses: responses as unknown as Json })
        .eq('id', id);

      if (error) throw error;

      toast.success('Anamnese atualizada');
      await fetchRecords();
      return true;
    } catch (err) {
      console.error('Error updating dynamic anamnesis:', err);
      toast.error('Erro ao atualizar anamnese');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchRecords]);

  return {
    records,
    loading,
    saving,
    fetchRecords,
    saveRecord,
    updateRecord,
  };
}
