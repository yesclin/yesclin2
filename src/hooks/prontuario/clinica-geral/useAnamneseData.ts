import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { AnamneseData } from '@/components/prontuario/clinica-geral/AnamneseBlock';

interface UseAnamneseDataResult {
  currentAnamnese: AnamneseData | null;
  anamneseHistory: AnamneseData[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveAnamnese: (data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar dados de Anamnese com versionamento
 * 
 * Regras:
 * - Não sobrescreve automaticamente anamneses anteriores
 * - Cada salvamento cria uma nova versão
 * - Mantém histórico completo
 */
export function useAnamneseData(patientId: string | null): UseAnamneseDataResult {
  const { clinic } = useClinicData();
  const [currentAnamnese, setCurrentAnamnese] = useState<AnamneseData | null>(null);
  const [anamneseHistory, setAnamneseHistory] = useState<AnamneseData[]>([]);
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
        .from('patient_anamneses')
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

      const mapped: AnamneseData[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        version: item.version,
        queixa_principal: item.queixa_principal || '',
        historia_doenca_atual: item.historia_doenca_atual || '',
        antecedentes_pessoais: item.antecedentes_pessoais || '',
        antecedentes_familiares: item.antecedentes_familiares || '',
        habitos_vida: item.habitos_vida || '',
        medicamentos_uso_continuo: item.medicamentos_uso_continuo || '',
        alergias: item.alergias || '',
        comorbidades: item.comorbidades || '',
        created_at: item.created_at,
        created_by: item.created_by || '',
        created_by_name: item.created_by ? creatorsMap[item.created_by] : undefined,
        is_current: item.is_current ?? false,
      }));

      setAnamneseHistory(mapped);
      setCurrentAnamnese(mapped.find(a => a.is_current) || mapped[0] || null);

    } catch (err) {
      console.error('Error fetching anamneses:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar anamnese');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveAnamnese = useCallback(async (
    data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>
  ) => {
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
          .from('patient_anamneses')
          .update({ is_current: false })
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id);

        if (updateError) throw updateError;
      }

      // Insert new anamnese version
      const { error: insertError } = await supabase
        .from('patient_anamneses')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          version: nextVersion,
          queixa_principal: data.queixa_principal,
          historia_doenca_atual: data.historia_doenca_atual,
          antecedentes_pessoais: data.antecedentes_pessoais,
          antecedentes_familiares: data.antecedentes_familiares,
          habitos_vida: data.habitos_vida,
          medicamentos_uso_continuo: data.medicamentos_uso_continuo,
          alergias: data.alergias,
          comorbidades: data.comorbidades,
          created_by: user.id,
          is_current: true,
        });

      if (insertError) throw insertError;

      toast.success(`Anamnese salva (versão ${nextVersion})`);
      await fetchAnamneses();

    } catch (err) {
      console.error('Error saving anamnese:', err);
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
