import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

/**
 * Estrutura de dados da Anamnese Psicológica
 */
export interface AnamnesePsicologiaData {
  id: string;
  patient_id: string;
  version: number;
  queixa_principal: string;
  historico_emocional_comportamental: string;
  contexto_familiar: string;
  contexto_social: string;
  historico_tratamentos: string;
  expectativas_terapia: string;
  fatores_risco: string;
  fatores_protecao: string;
  observacoes: string;
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
 * Hook para gerenciar dados de Anamnese Psicológica com versionamento
 * 
 * Regras:
 * - Não sobrescreve automaticamente anamneses anteriores
 * - Cada salvamento cria uma nova versão
 * - Mantém histórico completo
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
      // Fetch all anamneses for this patient, ordered by version desc
      const { data, error: fetchError } = await supabase
        .from('patient_anamnese_psicologia')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('version', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get creator names for each anamnese
      const creatorIds = [...new Set((data || []).map(a => a.created_by).filter(Boolean))];
      let creatorsMap: Record<string, string> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
        
        if (profiles) {
          creatorsMap = profiles.reduce((acc, p) => {
            if (p.user_id && p.full_name) {
              acc[p.user_id] = p.full_name;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const mapped: AnamnesePsicologiaData[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        version: item.version,
        queixa_principal: item.queixa_principal || '',
        historico_emocional_comportamental: item.historico_emocional_comportamental || '',
        contexto_familiar: item.contexto_familiar || '',
        contexto_social: item.contexto_social || '',
        historico_tratamentos: item.historico_tratamentos || '',
        expectativas_terapia: item.expectativas_terapia || '',
        fatores_risco: item.fatores_risco || '',
        fatores_protecao: item.fatores_protecao || '',
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
      setError(err instanceof Error ? err.message : 'Erro ao carregar anamnese');
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Get next version number
      const nextVersion = (currentAnamnese?.version || 0) + 1;

      // First, mark all existing anamneses as not current
      if (anamneseHistory.length > 0) {
        const { error: updateError } = await supabase
          .from('patient_anamnese_psicologia')
          .update({ is_current: false })
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id);

        if (updateError) throw updateError;
      }

      // Insert new anamnese version
      const { error: insertError } = await supabase
        .from('patient_anamnese_psicologia')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          version: nextVersion,
          queixa_principal: data.queixa_principal,
          historico_emocional_comportamental: data.historico_emocional_comportamental,
          contexto_familiar: data.contexto_familiar,
          contexto_social: data.contexto_social,
          historico_tratamentos: data.historico_tratamentos,
          expectativas_terapia: data.expectativas_terapia,
          fatores_risco: data.fatores_risco,
          fatores_protecao: data.fatores_protecao,
          observacoes: data.observacoes,
          created_by: user.id,
          is_current: true,
        });

      if (insertError) throw insertError;

      toast.success(`Anamnese psicológica salva (versão ${nextVersion})`);
      await fetchAnamneses();

    } catch (err) {
      console.error('Error saving anamnese psicologia:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar anamnese';
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
