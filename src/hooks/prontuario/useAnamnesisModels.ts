import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface AnamnesisModel {
  id: string;
  clinic_id: string | null;
  name: string;
  description: string | null;
  template_type: string;
  specialty_id: string | null;
  procedure_id: string | null;
  icon: string | null;
  campos: Json;
  is_active: boolean;
  is_default: boolean;
  is_system: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  // joined
  procedure_name?: string;
}

export function useAnamnesisModels(specialtyId: string | null | undefined) {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [models, setModels] = useState<AnamnesisModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchModels = useCallback(async () => {
    if (!clinic?.id || !specialtyId) {
      setModels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .select('*, procedures(name)')
        .eq('specialty_id', specialtyId)
        .eq('archived', false)
        .or(`clinic_id.eq.${clinic.id},clinic_id.is.null`)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      const parsed: AnamnesisModel[] = (data || []).map((d: any) => ({
        ...d,
        procedure_name: d.procedures?.name || null,
      }));

      setModels(parsed);
    } catch (err) {
      console.error('Error fetching anamnesis models:', err);
      toast.error('Erro ao carregar modelos de anamnese');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, specialtyId]);

  useEffect(() => {
    if (!clinicLoading) fetchModels();
  }, [clinicLoading, fetchModels]);

  const createModel = async (input: {
    name: string;
    description?: string;
    template_type?: string;
    procedure_id?: string | null;
    icon?: string;
  }) => {
    if (!clinic?.id || !specialtyId) return null;
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .insert({
          clinic_id: clinic.id,
          specialty_id: specialtyId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          template_type: input.template_type || 'custom',
          procedure_id: input.procedure_id || null,
          icon: input.icon || 'ClipboardList',
          campos: [],
          is_active: true,
          is_default: false,
          is_system: false,
          created_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Modelo criado');
      await fetchModels();
      return data;
    } catch (err) {
      console.error('Error creating model:', err);
      toast.error('Erro ao criar modelo');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateModel = async (id: string, input: {
    name?: string;
    description?: string;
    procedure_id?: string | null;
    icon?: string;
  }) => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.description !== undefined) updateData.description = input.description?.trim() || null;
      if (input.procedure_id !== undefined) updateData.procedure_id = input.procedure_id || null;
      if (input.icon !== undefined) updateData.icon = input.icon;

      const { error } = await supabase
        .from('anamnesis_templates')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Modelo atualizado');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Error updating model:', err);
      toast.error('Erro ao atualizar');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const duplicateModel = async (id: string) => {
    if (!clinic?.id) return null;
    setSaving(true);
    try {
      const original = models.find(m => m.id === id);
      if (!original) throw new Error('Model not found');

      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .insert({
          clinic_id: clinic.id,
          specialty_id: original.specialty_id,
          name: `${original.name} (Cópia)`,
          description: original.description,
          template_type: original.template_type,
          procedure_id: original.procedure_id,
          icon: original.icon,
          campos: original.campos,
          is_active: true,
          is_default: false,
          is_system: false,
          created_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Modelo duplicado');
      await fetchModels();
      return data;
    } catch (err) {
      console.error('Error duplicating model:', err);
      toast.error('Erro ao duplicar');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const setAsDefault = async (id: string) => {
    if (!clinic?.id || !specialtyId) return false;
    setSaving(true);
    try {
      // Remove default from all others in this specialty
      await supabase
        .from('anamnesis_templates')
        .update({ is_default: false })
        .eq('specialty_id', specialtyId)
        .or(`clinic_id.eq.${clinic.id},clinic_id.is.null`);

      // Set new default
      const { error } = await supabase
        .from('anamnesis_templates')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Modelo definido como padrão');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Error setting default:', err);
      toast.error('Erro ao definir padrão');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    // Prevent deactivating if it's the last active model
    if (!active) {
      const activeModels = models.filter(m => m.is_active && m.id !== id);
      if (activeModels.length === 0) {
        toast.error('Deve haver pelo menos 1 modelo ativo por especialidade');
        return false;
      }
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('anamnesis_templates')
        .update({ is_active: active })
        .eq('id', id);

      if (error) throw error;
      toast.success(active ? 'Modelo ativado' : 'Modelo desativado');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Error toggling model:', err);
      toast.error('Erro ao alterar modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    models,
    loading: loading || clinicLoading,
    saving,
    fetchModels,
    createModel,
    updateModel,
    duplicateModel,
    setAsDefault,
    toggleActive,
  };
}
