import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface TabConfig {
  id: string;
  clinic_id: string;
  name: string;
  key: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  scope: 'system' | 'specialty' | 'professional';
  specialty_id: string | null;
  professional_id: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TABS = [
  { name: 'Resumo', key: 'resumo', icon: 'LayoutDashboard', display_order: 1 },
  { name: 'Anamnese', key: 'anamnese', icon: 'FileText', display_order: 2 },
  { name: 'Sinais Vitais', key: 'sinais_vitais', icon: 'Heart', display_order: 3 },
  { name: 'Evolução', key: 'evolucao', icon: 'Activity', display_order: 4 },
  { name: 'Diagnóstico (CID)', key: 'diagnostico', icon: 'Stethoscope', display_order: 5 },
  { name: 'Solicitação de Exames', key: 'exames_solicitacao', icon: 'ClipboardList', display_order: 6 },
  { name: 'Plano/Conduta', key: 'conduta', icon: 'Target', display_order: 7 },
  { name: 'Prescrições', key: 'prescricoes', icon: 'Pill', display_order: 8 },
  { name: 'Exames/Documentos', key: 'exames', icon: 'Paperclip', display_order: 9 },
  { name: 'Histórico', key: 'historico', icon: 'History', display_order: 10 },
];

export function useTabs() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [tabs, setTabs] = useState<TabConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTabs = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_tabs')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('scope', 'system')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTabs((data as TabConfig[]) || []);
    } catch (err) {
      console.error('Error fetching tabs:', err);
      toast.error('Erro ao carregar abas');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchTabs();
    }
  }, [clinicLoading, clinic?.id, fetchTabs]);

  const initializeDefaults = async () => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const { count } = await supabase
        .from('medical_record_tabs')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinic.id);

      if (count && count > 0) {
        toast.info('Abas já configuradas');
        return true;
      }

      const inserts = DEFAULT_TABS.map((tab) => ({
        clinic_id: clinic.id,
        name: tab.name,
        key: tab.key,
        icon: tab.icon,
        display_order: tab.display_order,
        is_active: true,
        is_system: true,
        scope: 'system' as const,
        specialty_id: null,
        professional_id: null,
      }));

      const { error } = await supabase.from('medical_record_tabs').insert(inserts);
      if (error) throw error;

      toast.success('Abas padrão criadas');
      await fetchTabs();
      return true;
    } catch (err) {
      console.error('Error initializing tabs:', err);
      toast.error('Erro ao criar abas');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('medical_record_tabs')
        .update({ is_active: active })
        .eq('id', id);

      if (error) throw error;
      setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: active } : t)));
      toast.success(active ? 'Aba ativada' : 'Aba desativada');
    } catch (err) {
      console.error('Error toggling tab:', err);
      toast.error('Erro ao alterar aba');
    } finally {
      setSaving(false);
    }
  };

  const reorder = async (reordered: { id: string; display_order: number }[]) => {
    setSaving(true);
    try {
      for (const item of reordered) {
        const { error } = await supabase
          .from('medical_record_tabs')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
        if (error) throw error;
      }
      await fetchTabs();
      toast.success('Ordem salva');
    } catch (err) {
      console.error('Error reordering tabs:', err);
      toast.error('Erro ao reordenar');
    } finally {
      setSaving(false);
    }
  };

  return {
    tabs,
    loading: loading || clinicLoading,
    saving,
    fetchTabs,
    initializeDefaults,
    toggleActive,
    reorder,
  };
}
