import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────
export type CampoTipo =
  | 'texto_curto'
  | 'texto_longo'
  | 'numerico'
  | 'data'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'automatico'
  | 'calculado';

export interface CampoModelo {
  id: string;
  label: string;
  tipo: CampoTipo;
  obrigatorio: boolean;
  visivel: boolean;
  ajuda: string;
  placeholder: string;
  opcoes: string[];         // for select/multiselect
  formula: string;          // for calculado
  campo_automatico: string; // for automatico (e.g. 'idade_paciente')
  valor_padrao: string;
  ordem: number;
}

export interface SecaoModelo {
  id: string;
  titulo: string;
  ordem: number;
  campos: CampoModelo[];
}

export interface EstruturaModelo {
  sections: SecaoModelo[];
}

export interface ModeloProntuario {
  id: string;
  clinic_id: string;
  nome: string;
  especialidade_id: string | null;
  estrutura_json: EstruturaModelo;
  is_padrao: boolean;
  is_sistema: boolean;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ────────────────────────────────────────────
export function createEmptyCampo(ordem: number): CampoModelo {
  return {
    id: crypto.randomUUID(),
    label: '',
    tipo: 'texto_curto',
    obrigatorio: false,
    visivel: true,
    ajuda: '',
    placeholder: '',
    opcoes: [],
    formula: '',
    campo_automatico: '',
    valor_padrao: '',
    ordem,
  };
}

export function createEmptySecao(ordem: number): SecaoModelo {
  return {
    id: crypto.randomUUID(),
    titulo: '',
    ordem,
    campos: [],
  };
}

// ─── Hook ───────────────────────────────────────────────
export function useModelosProntuario() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [modelos, setModelos] = useState<ModeloProntuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchModelos = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('modelos_prontuario')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map((m: any) => ({
        ...m,
        estrutura_json: (typeof m.estrutura_json === 'string'
          ? JSON.parse(m.estrutura_json)
          : m.estrutura_json) as EstruturaModelo,
      })) as ModeloProntuario[];

      setModelos(parsed);
    } catch (err) {
      console.error('Error fetching modelos:', err);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) fetchModelos();
  }, [clinicLoading, clinic?.id, fetchModelos]);

  const create = async (nome: string, especialidadeId?: string | null): Promise<string | null> => {
    if (!clinic?.id) return null;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('modelos_prontuario')
        .insert({
          clinic_id: clinic.id,
          nome,
          especialidade_id: especialidadeId || null,
          created_by: userData?.user?.id || null,
          estrutura_json: { sections: [createEmptySecao(1)] },
        } as any)
        .select()
        .single();

      if (error) throw error;
      toast.success('Modelo criado');
      await fetchModelos();
      return data.id;
    } catch (err) {
      console.error('Error creating modelo:', err);
      toast.error('Erro ao criar modelo');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateEstrutura = async (id: string, estrutura: EstruturaModelo): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('modelos_prontuario')
        .update({ estrutura_json: estrutura as any })
        .eq('id', id);

      if (error) throw error;
      toast.success('Modelo salvo');
      await fetchModelos();
      return true;
    } catch (err) {
      console.error('Error updating modelo:', err);
      toast.error('Erro ao salvar modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateInfo = async (id: string, data: { nome?: string; ativo?: boolean; is_padrao?: boolean }): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('modelos_prontuario')
        .update(data as any)
        .eq('id', id);

      if (error) throw error;
      toast.success('Modelo atualizado');
      await fetchModelos();
      return true;
    } catch (err) {
      console.error('Error updating modelo info:', err);
      toast.error('Erro ao atualizar modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (id: string): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const original = modelos.find(m => m.id === id);
      if (!original) throw new Error('Modelo não encontrado');

      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('modelos_prontuario')
        .insert({
          clinic_id: clinic.id,
          nome: `${original.nome} (Cópia)`,
          especialidade_id: original.especialidade_id,
          estrutura_json: original.estrutura_json as any,
          is_padrao: false,
          is_sistema: false,
          ativo: false,
          created_by: userData?.user?.id || null,
        } as any);

      if (error) throw error;
      toast.success('Modelo duplicado');
      await fetchModelos();
      return true;
    } catch (err) {
      console.error('Error duplicating modelo:', err);
      toast.error('Erro ao duplicar modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase.from('modelos_prontuario').delete().eq('id', id);
      if (error) throw error;
      toast.success('Modelo excluído');
      await fetchModelos();
      return true;
    } catch (err) {
      console.error('Error removing modelo:', err);
      toast.error('Erro ao excluir modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    modelos,
    loading: loading || clinicLoading,
    saving,
    fetchModelos,
    create,
    updateEstrutura,
    updateInfo,
    duplicate,
    remove,
  };
}
