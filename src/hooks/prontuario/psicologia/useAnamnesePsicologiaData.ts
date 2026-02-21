import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

/**
 * Estrutura de dados da Avaliação Inicial Psicológica
 */
export interface AnamnesePsicologiaData {
  id: string;
  patient_id: string;
  version: number;
  // Queixa Principal
  queixa_principal: string;
  // História do Problema Atual
  historico_emocional_comportamental: string;
  // Histórico Psicológico/Psiquiátrico
  ja_fez_terapia: boolean;
  ja_fez_terapia_obs: string;
  uso_medicacao: boolean;
  uso_medicacao_qual: string;
  diagnostico_previo: string;
  internacoes: boolean;
  internacoes_obs: string;
  // Histórico Familiar
  contexto_familiar: string;
  // Contexto Atual
  contexto_trabalho: string;
  contexto_relacionamentos: string;
  contexto_vida_social: string;
  contexto_rotina: string;
  contexto_sono: string;
  contexto_alimentacao: string;
  // Legacy (mapped)
  contexto_social: string;
  historico_tratamentos: string;
  expectativas_terapia: string;
  // Fatores
  fatores_risco: string;
  fatores_protecao: string;
  // Avaliação Técnica
  impressoes_clinicas: string;
  formulacao_inicial: string;
  hipoteses: string;
  ocultar_avaliacao_relatorio: boolean;
  // Objetivos Terapêuticos
  objetivo_1: string;
  objetivo_2: string;
  objetivo_3: string;
  // Modalidade
  modalidade: string;
  // Observações
  observacoes: string;
  // Meta
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

export type AnamnesePsicologiaFormData = Omit<
  AnamnesePsicologiaData, 
  'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'
>;

interface UseAnamnesePsicologiaDataResult {
  currentAnamnese: AnamnesePsicologiaData | null;
  anamneseHistory: AnamnesePsicologiaData[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveAnamnese: (data: AnamnesePsicologiaFormData) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar Avaliação Inicial Psicológica com versionamento
 */
export function useAnamnesePsicologiaData(patientId: string | null): UseAnamnesePsicologiaDataResult {
  const { clinic } = useClinicData();
  const [currentAnamnese, setCurrentAnamnese] = useState<AnamnesePsicologiaData | null>(null);
  const [anamneseHistory, setAnamneseHistory] = useState<AnamnesePsicologiaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnamneses = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setCurrentAnamnese(null);
      setAnamneseHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_anamnese_psicologia')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('version', { ascending: false });

      if (fetchError) throw fetchError;

      const creatorIds = [...new Set((data || []).map(a => a.created_by).filter(Boolean))];
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

      const mapped: AnamnesePsicologiaData[] = (data || []).map((item: any) => ({
        id: item.id,
        patient_id: item.patient_id,
        version: item.version,
        queixa_principal: item.queixa_principal || '',
        historico_emocional_comportamental: item.historico_emocional_comportamental || '',
        ja_fez_terapia: item.ja_fez_terapia ?? false,
        ja_fez_terapia_obs: item.ja_fez_terapia_obs || '',
        uso_medicacao: item.uso_medicacao ?? false,
        uso_medicacao_qual: item.uso_medicacao_qual || '',
        diagnostico_previo: item.diagnostico_previo || '',
        internacoes: item.internacoes ?? false,
        internacoes_obs: item.internacoes_obs || '',
        contexto_familiar: item.contexto_familiar || '',
        contexto_trabalho: item.contexto_trabalho || '',
        contexto_relacionamentos: item.contexto_relacionamentos || '',
        contexto_vida_social: item.contexto_vida_social || '',
        contexto_rotina: item.contexto_rotina || '',
        contexto_sono: item.contexto_sono || '',
        contexto_alimentacao: item.contexto_alimentacao || '',
        contexto_social: item.contexto_social || '',
        historico_tratamentos: item.historico_tratamentos || '',
        expectativas_terapia: item.expectativas_terapia || '',
        fatores_risco: item.fatores_risco || '',
        fatores_protecao: item.fatores_protecao || '',
        impressoes_clinicas: item.impressoes_clinicas || '',
        formulacao_inicial: item.formulacao_inicial || '',
        hipoteses: item.hipoteses || '',
        ocultar_avaliacao_relatorio: item.ocultar_avaliacao_relatorio ?? false,
        objetivo_1: item.objetivo_1 || '',
        objetivo_2: item.objetivo_2 || '',
        objetivo_3: item.objetivo_3 || '',
        modalidade: item.modalidade || 'presencial',
        observacoes: item.observacoes || '',
        created_at: item.created_at,
        created_by: item.created_by || '',
        created_by_name: item.created_by ? creatorsMap[item.created_by] : undefined,
        is_current: item.is_current ?? false,
      }));

      setAnamneseHistory(mapped);
      setCurrentAnamnese(mapped.find(a => a.is_current) || mapped[0] || null);
    } catch (err) {
      console.error('Error fetching anamnese psicologia:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar avaliação');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveAnamnese = useCallback(async (data: AnamnesePsicologiaFormData) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const nextVersion = (currentAnamnese?.version || 0) + 1;

      if (anamneseHistory.length > 0) {
        const { error: updateError } = await supabase
          .from('patient_anamnese_psicologia')
          .update({ is_current: false } as any)
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id);
        if (updateError) throw updateError;
      }

      const { error: insertError } = await supabase
        .from('patient_anamnese_psicologia')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          version: nextVersion,
          queixa_principal: data.queixa_principal,
          historico_emocional_comportamental: data.historico_emocional_comportamental,
          ja_fez_terapia: data.ja_fez_terapia,
          ja_fez_terapia_obs: data.ja_fez_terapia_obs,
          uso_medicacao: data.uso_medicacao,
          uso_medicacao_qual: data.uso_medicacao_qual,
          diagnostico_previo: data.diagnostico_previo,
          internacoes: data.internacoes,
          internacoes_obs: data.internacoes_obs,
          contexto_familiar: data.contexto_familiar,
          contexto_trabalho: data.contexto_trabalho,
          contexto_relacionamentos: data.contexto_relacionamentos,
          contexto_vida_social: data.contexto_vida_social,
          contexto_rotina: data.contexto_rotina,
          contexto_sono: data.contexto_sono,
          contexto_alimentacao: data.contexto_alimentacao,
          contexto_social: data.contexto_social,
          historico_tratamentos: data.historico_tratamentos,
          expectativas_terapia: data.expectativas_terapia,
          fatores_risco: data.fatores_risco,
          fatores_protecao: data.fatores_protecao,
          impressoes_clinicas: data.impressoes_clinicas,
          formulacao_inicial: data.formulacao_inicial,
          hipoteses: data.hipoteses,
          ocultar_avaliacao_relatorio: data.ocultar_avaliacao_relatorio,
          objetivo_1: data.objetivo_1,
          objetivo_2: data.objetivo_2,
          objetivo_3: data.objetivo_3,
          modalidade: data.modalidade,
          observacoes: data.observacoes,
          created_by: user.id,
          is_current: true,
        } as any);

      if (insertError) throw insertError;

      toast.success(`Avaliação inicial salva (versão ${nextVersion})`);
      await fetchAnamneses();
    } catch (err) {
      console.error('Error saving anamnese psicologia:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar avaliação';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentAnamnese, anamneseHistory, fetchAnamneses]);

  useEffect(() => {
    fetchAnamneses();
  }, [fetchAnamneses]);

  return {
    currentAnamnese,
    anamneseHistory,
    loading,
    saving,
    error,
    saveAnamnese,
    refetch: fetchAnamneses,
  };
}
