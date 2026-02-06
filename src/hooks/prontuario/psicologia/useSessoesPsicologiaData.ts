import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

/**
 * Status da sessão
 */
export type StatusSessao = 'rascunho' | 'assinada';

export const statusSessaoConfig: Record<StatusSessao, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  assinada: { label: 'Assinada', color: 'bg-green-100 text-green-700 border-green-300' },
};

/**
 * Estrutura de dados da Sessão Psicológica
 */
export interface SessaoPsicologia {
  id: string;
  patient_id: string;
  clinic_id: string;
  data_sessao: string;
  duracao_minutos: number;
  abordagem_terapeutica: string;
  relato_paciente: string;
  intervencoes_realizadas: string;
  observacoes_terapeuta: string;
  encaminhamentos_tarefas: string;
  status: StatusSessao;
  assinada_em: string | null;
  profissional_id: string;
  profissional_nome?: string;
  created_at: string;
}

export interface SessaoFormData {
  data_sessao: string;
  duracao_minutos: number;
  abordagem_terapeutica: string;
  relato_paciente: string;
  intervencoes_realizadas: string;
  observacoes_terapeuta: string;
  encaminhamentos_tarefas: string;
}

interface UseSessoesPsicologiaDataResult {
  sessoes: SessaoPsicologia[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveSessao: (data: SessaoFormData & { assinar: boolean }) => Promise<void>;
  signSessao: (sessaoId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar Sessões de Psicoterapia
 * 
 * Regras:
 * - Exibidas em ordem cronológica (mais recente primeiro)
 * - Nunca podem ser apagadas automaticamente
 * - Após assinadas, não podem ser editadas
 */
export function useSessoesPsicologiaData(
  patientId: string | null,
  currentProfessionalId?: string
): UseSessoesPsicologiaDataResult {
  const { clinic } = useClinicData();
  const [sessoes, setSessoes] = useState<SessaoPsicologia[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessoes = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setSessoes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('sessoes_psicologia')
        .select(`
          *,
          professionals:profissional_id (
            id,
            profiles:user_id (full_name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('data_sessao', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: SessaoPsicologia[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        data_sessao: item.data_sessao,
        duracao_minutos: item.duracao_minutos,
        abordagem_terapeutica: item.abordagem_terapeutica || '',
        relato_paciente: item.relato_paciente || '',
        intervencoes_realizadas: item.intervencoes_realizadas || '',
        observacoes_terapeuta: item.observacoes_terapeuta || '',
        encaminhamentos_tarefas: item.encaminhamentos_tarefas || '',
        status: item.status as StatusSessao,
        assinada_em: item.assinada_em,
        profissional_id: item.profissional_id,
        profissional_nome: (item.professionals as any)?.profiles?.full_name || 'Profissional',
        created_at: item.created_at,
      }));

      setSessoes(mapped);
    } catch (err) {
      console.error('Error fetching sessoes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveSessao = useCallback(async (data: SessaoFormData & { assinar: boolean }) => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados insuficientes para salvar a sessão');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const insertData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        profissional_id: currentProfessionalId,
        data_sessao: data.data_sessao,
        duracao_minutos: data.duracao_minutos,
        abordagem_terapeutica: data.abordagem_terapeutica,
        relato_paciente: data.relato_paciente,
        intervencoes_realizadas: data.intervencoes_realizadas,
        observacoes_terapeuta: data.observacoes_terapeuta,
        encaminhamentos_tarefas: data.encaminhamentos_tarefas,
        status: data.assinar ? 'assinada' : 'rascunho',
        assinada_em: data.assinar ? new Date().toISOString() : null,
      };

      const { error: insertError } = await supabase
        .from('sessoes_psicologia')
        .insert(insertData);

      if (insertError) throw insertError;

      toast.success(data.assinar ? 'Sessão registrada e assinada' : 'Sessão salva como rascunho');
      await fetchSessoes();
    } catch (err) {
      console.error('Error saving sessao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar sessão';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchSessoes]);

  const signSessao = useCallback(async (sessaoId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('sessoes_psicologia')
        .update({
          status: 'assinada',
          assinada_em: new Date().toISOString(),
        })
        .eq('id', sessaoId);

      if (updateError) throw updateError;

      toast.success('Sessão assinada com sucesso');
      await fetchSessoes();
    } catch (err) {
      console.error('Error signing sessao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao assinar sessão';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchSessoes]);

  useEffect(() => {
    fetchSessoes();
  }, [fetchSessoes]);

  return {
    sessoes,
    loading,
    saving,
    error,
    saveSessao,
    signSessao,
    refetch: fetchSessoes,
  };
}
