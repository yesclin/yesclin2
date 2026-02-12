import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { TriggerType } from '@/types/comunicacao';

export interface AutomationRuleRow {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown> | null;
  template_id: string | null;
  is_active: boolean;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template?: {
    id: string;
    name: string;
    channel: string;
    content: string;
  } | null;
}

export interface AutomationFormData {
  name: string;
  description: string;
  trigger_type: TriggerType;
  trigger_config: {
    hours_before?: number;
    days_after?: number;
    days_inactive?: number;
  };
  template_id: string | null;
  is_active: boolean;
  priority: number;
}

export function useAutomationRules() {
  const { clinic } = useClinicData();
  const [automations, setAutomations] = useState<AutomationRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAutomations = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*, message_templates(id, name, channel, content)')
        .eq('clinic_id', clinic.id)
        .order('priority', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        ...row,
        is_active: row.is_active ?? false,
        priority: row.priority ?? 0,
        trigger_config: (row.trigger_config as Record<string, unknown>) ?? {},
        template: row.message_templates ?? null,
      }));

      setAutomations(mapped);
    } catch (err) {
      console.error('Error fetching automations:', err);
      toast.error('Erro ao carregar automações');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const createAutomation = async (formData: AutomationFormData) => {
    if (!clinic?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('automation_rules')
        .insert({
          clinic_id: clinic.id,
          name: formData.name,
          description: formData.description || null,
          trigger_type: formData.trigger_type,
          trigger_config: formData.trigger_config as any,
          template_id: formData.template_id || null,
          is_active: formData.is_active,
          priority: formData.priority,
        });
      if (error) throw error;
      toast.success('Automação criada com sucesso');
      await fetchAutomations();
    } catch (err: any) {
      console.error('Error creating automation:', err);
      toast.error('Erro ao criar automação: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const updateAutomation = async (id: string, formData: Partial<AutomationFormData>) => {
    setSaving(true);
    try {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.description !== undefined) updateData.description = formData.description || null;
      if (formData.trigger_type !== undefined) updateData.trigger_type = formData.trigger_type;
      if (formData.trigger_config !== undefined) updateData.trigger_config = formData.trigger_config;
      if (formData.template_id !== undefined) updateData.template_id = formData.template_id || null;
      if (formData.is_active !== undefined) updateData.is_active = formData.is_active;
      if (formData.priority !== undefined) updateData.priority = formData.priority;

      const { error } = await supabase
        .from('automation_rules')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      toast.success('Automação atualizada com sucesso');
      await fetchAutomations();
    } catch (err: any) {
      console.error('Error updating automation:', err);
      toast.error('Erro ao atualizar automação: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const deleteAutomation = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Automação excluída com sucesso');
      await fetchAutomations();
    } catch (err: any) {
      console.error('Error deleting automation:', err);
      toast.error('Erro ao excluir automação: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const toggleAutomation = async (id: string) => {
    const automation = automations.find((a) => a.id === id);
    if (!automation) return;
    await updateAutomation(id, { is_active: !automation.is_active });
  };

  const duplicateAutomation = async (automation: AutomationRuleRow) => {
    if (!clinic?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('automation_rules')
        .insert({
          clinic_id: clinic.id,
          name: `${automation.name} (Cópia)`,
          description: automation.description,
          trigger_type: automation.trigger_type,
          trigger_config: automation.trigger_config as any,
          template_id: automation.template_id,
          is_active: false,
          priority: (automations.length + 1),
        });
      if (error) throw error;
      toast.success('Automação duplicada com sucesso');
      await fetchAutomations();
    } catch (err: any) {
      console.error('Error duplicating automation:', err);
      toast.error('Erro ao duplicar automação: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return {
    automations,
    loading,
    saving,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    duplicateAutomation,
    refetch: fetchAutomations,
  };
}
