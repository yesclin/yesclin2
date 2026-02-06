/**
 * NUTRIÇÃO - Anamnese Nutricional
 * 
 * Hook para gerenciar dados de anamnese nutricional do paciente.
 * Segue o padrão de versionamento: não sobrescreve automaticamente,
 * permite atualização manual e mantém histórico completo.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type FrequenciaConsumo = 'nunca' | 'raramente' | 'semanal' | 'diario' | 'varias_vezes_dia';

export interface AnamneseNutricional {
  id: string;
  patient_id: string;
  clinic_id: string;
  version: number;
  is_current: boolean;
  
  // Queixa Principal
  queixa_principal: string;
  
  // Histórico Alimentar
  historico_alimentar: string;
  dietas_anteriores: string;
  
  // Rotina Diária
  rotina_diaria: string;
  horario_acordar: string | null;
  horario_dormir: string | null;
  horario_trabalho: string | null;
  pratica_atividade_fisica: boolean;
  atividade_fisica_detalhes: string | null;
  
  // Hábitos Alimentares
  refeicoes_por_dia: number | null;
  come_fora_casa: FrequenciaConsumo | null;
  prepara_propria_refeicao: boolean;
  quem_prepara_refeicoes: string | null;
  come_assistindo_tv: boolean;
  velocidade_refeicao: 'lenta' | 'normal' | 'rapida' | null;
  mastigacao: 'adequada' | 'rapida' | 'muito_rapida' | null;
  
  // Consumo de Água
  consumo_agua_litros: number | null;
  tipo_agua: 'filtrada' | 'mineral' | 'torneira' | 'outro' | null;
  
  // Suplementos
  usa_suplementos: boolean;
  suplementos_detalhes: string | null;
  
  // Restrições Alimentares
  restricoes_alimentares: string[];
  restricoes_detalhes: string | null;
  
  // Intolerâncias e Alergias
  intolerancias: string[];
  alergias_alimentares: string[];
  alergias_detalhes: string | null;
  
  // Objetivos
  objetivos_paciente: string;
  peso_desejado_kg: number | null;
  prazo_objetivo: string | null;
  
  // Observações
  observacoes: string | null;
  
  // Auditoria
  created_at: string;
  created_by: string;
  created_by_name?: string;
}

export interface AnamneseNutricionalFormData {
  queixa_principal: string;
  historico_alimentar: string;
  dietas_anteriores: string;
  rotina_diaria: string;
  horario_acordar: string | null;
  horario_dormir: string | null;
  horario_trabalho: string | null;
  pratica_atividade_fisica: boolean;
  atividade_fisica_detalhes: string | null;
  refeicoes_por_dia: number | null;
  come_fora_casa: FrequenciaConsumo | null;
  prepara_propria_refeicao: boolean;
  quem_prepara_refeicoes: string | null;
  come_assistindo_tv: boolean;
  velocidade_refeicao: 'lenta' | 'normal' | 'rapida' | null;
  mastigacao: 'adequada' | 'rapida' | 'muito_rapida' | null;
  consumo_agua_litros: number | null;
  tipo_agua: 'filtrada' | 'mineral' | 'torneira' | 'outro' | null;
  usa_suplementos: boolean;
  suplementos_detalhes: string | null;
  restricoes_alimentares: string[];
  restricoes_detalhes: string | null;
  intolerancias: string[];
  alergias_alimentares: string[];
  alergias_detalhes: string | null;
  objetivos_paciente: string;
  peso_desejado_kg: number | null;
  prazo_objetivo: string | null;
  observacoes: string | null;
}

/**
 * Hook para gerenciar anamnese nutricional com versionamento
 */
export function useAnamneseNutricionalData(patientId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Buscar todas as anamneses do paciente (armazenadas em clinical_evolutions)
  const {
    data: anamneses,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-anamnese', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('evolution_type', 'anamnese_nutricional')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos criadores
      const creatorIds = [...new Set((data || []).map(a => a.professional_id).filter(Boolean))];
      let creatorsMap: Record<string, string> = {};

      if (creatorIds.length > 0) {
        const { data: professionals } = await supabase
          .from('professionals')
          .select('id, profiles:profiles!professionals_user_id_fkey(full_name)')
          .in('id', creatorIds);

        if (professionals) {
          creatorsMap = professionals.reduce((acc, p) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prof = p as any;
            if (prof.id && prof.profiles?.[0]?.full_name) {
              acc[prof.id] = prof.profiles[0].full_name;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Mapear para o formato esperado
      return data.map((item, index) => {
        const content = item.content as Record<string, unknown>;
        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          version: data.length - index, // Versão decrescente (mais recente = maior)
          is_current: index === 0, // Primeiro é o atual
          queixa_principal: (content?.queixa_principal as string) || '',
          historico_alimentar: (content?.historico_alimentar as string) || '',
          dietas_anteriores: (content?.dietas_anteriores as string) || '',
          rotina_diaria: (content?.rotina_diaria as string) || '',
          horario_acordar: (content?.horario_acordar as string) || null,
          horario_dormir: (content?.horario_dormir as string) || null,
          horario_trabalho: (content?.horario_trabalho as string) || null,
          pratica_atividade_fisica: (content?.pratica_atividade_fisica as boolean) || false,
          atividade_fisica_detalhes: (content?.atividade_fisica_detalhes as string) || null,
          refeicoes_por_dia: (content?.refeicoes_por_dia as number) || null,
          come_fora_casa: (content?.come_fora_casa as FrequenciaConsumo) || null,
          prepara_propria_refeicao: (content?.prepara_propria_refeicao as boolean) || false,
          quem_prepara_refeicoes: (content?.quem_prepara_refeicoes as string) || null,
          come_assistindo_tv: (content?.come_assistindo_tv as boolean) || false,
          velocidade_refeicao: (content?.velocidade_refeicao as 'lenta' | 'normal' | 'rapida') || null,
          mastigacao: (content?.mastigacao as 'adequada' | 'rapida' | 'muito_rapida') || null,
          consumo_agua_litros: (content?.consumo_agua_litros as number) || null,
          tipo_agua: (content?.tipo_agua as 'filtrada' | 'mineral' | 'torneira' | 'outro') || null,
          usa_suplementos: (content?.usa_suplementos as boolean) || false,
          suplementos_detalhes: (content?.suplementos_detalhes as string) || null,
          restricoes_alimentares: (content?.restricoes_alimentares as string[]) || [],
          restricoes_detalhes: (content?.restricoes_detalhes as string) || null,
          intolerancias: (content?.intolerancias as string[]) || [],
          alergias_alimentares: (content?.alergias_alimentares as string[]) || [],
          alergias_detalhes: (content?.alergias_detalhes as string) || null,
          objetivos_paciente: (content?.objetivos_paciente as string) || '',
          peso_desejado_kg: (content?.peso_desejado_kg as number) || null,
          prazo_objetivo: (content?.prazo_objetivo as string) || null,
          observacoes: item.notes,
          created_at: item.created_at,
          created_by: item.professional_id,
          created_by_name: item.professional_id ? creatorsMap[item.professional_id] : undefined,
        };
      }) as AnamneseNutricional[];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Anamnese atual (versão mais recente)
  const currentAnamnese = anamneses?.[0] || null;

  // Histórico (todas as versões)
  const anamneseHistory = anamneses || [];

  // Salvar nova versão da anamnese
  const saveAnamnese = useCallback(async (
    formData: AnamneseNutricionalFormData,
    professionalId: string
  ) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return null;
    }

    setSaving(true);

    try {
      const content = {
        queixa_principal: formData.queixa_principal,
        historico_alimentar: formData.historico_alimentar,
        dietas_anteriores: formData.dietas_anteriores,
        rotina_diaria: formData.rotina_diaria,
        horario_acordar: formData.horario_acordar,
        horario_dormir: formData.horario_dormir,
        horario_trabalho: formData.horario_trabalho,
        pratica_atividade_fisica: formData.pratica_atividade_fisica,
        atividade_fisica_detalhes: formData.atividade_fisica_detalhes,
        refeicoes_por_dia: formData.refeicoes_por_dia,
        come_fora_casa: formData.come_fora_casa,
        prepara_propria_refeicao: formData.prepara_propria_refeicao,
        quem_prepara_refeicoes: formData.quem_prepara_refeicoes,
        come_assistindo_tv: formData.come_assistindo_tv,
        velocidade_refeicao: formData.velocidade_refeicao,
        mastigacao: formData.mastigacao,
        consumo_agua_litros: formData.consumo_agua_litros,
        tipo_agua: formData.tipo_agua,
        usa_suplementos: formData.usa_suplementos,
        suplementos_detalhes: formData.suplementos_detalhes,
        restricoes_alimentares: formData.restricoes_alimentares,
        restricoes_detalhes: formData.restricoes_detalhes,
        intolerancias: formData.intolerancias,
        alergias_alimentares: formData.alergias_alimentares,
        alergias_detalhes: formData.alergias_detalhes,
        objetivos_paciente: formData.objetivos_paciente,
        peso_desejado_kg: formData.peso_desejado_kg,
        prazo_objetivo: formData.prazo_objetivo,
      };

      const insertData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        professional_id: professionalId,
        evolution_type: 'anamnese_nutricional',
        specialty: 'nutricao',
        content,
        notes: formData.observacoes,
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by: professionalId,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      const newVersion = (currentAnamnese?.version || 0) + 1;
      toast.success(`Anamnese nutricional salva (versão ${newVersion})`);

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['nutricao-anamnese', patientId] });

      return data;
    } catch (error) {
      console.error('Erro ao salvar anamnese nutricional:', error);
      toast.error('Erro ao salvar anamnese nutricional');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentAnamnese, queryClient]);

  return {
    currentAnamnese,
    anamneseHistory,
    loading,
    saving,
    saveAnamnese,
    refetch,
  };
}

// Labels para frequência de consumo
export const FREQUENCIA_CONSUMO_LABELS: Record<FrequenciaConsumo, string> = {
  nunca: 'Nunca',
  raramente: 'Raramente',
  semanal: 'Semanalmente',
  diario: 'Diariamente',
  varias_vezes_dia: 'Várias vezes ao dia',
};

// Opções comuns de restrições alimentares
export const RESTRICOES_ALIMENTARES_OPTIONS = [
  'Vegetariano',
  'Vegano',
  'Sem glúten',
  'Sem lactose',
  'Low carb',
  'Kosher',
  'Halal',
  'Sem açúcar',
  'Sem carne vermelha',
  'Sem frutos do mar',
];

// Opções comuns de intolerâncias
export const INTOLERANCIAS_OPTIONS = [
  'Lactose',
  'Glúten',
  'Frutose',
  'Histamina',
  'FODMAPs',
  'Cafeína',
];

// Opções comuns de alergias alimentares
export const ALERGIAS_ALIMENTARES_OPTIONS = [
  'Amendoim',
  'Nozes',
  'Leite de vaca',
  'Ovos',
  'Trigo',
  'Soja',
  'Peixes',
  'Frutos do mar',
  'Gergelim',
  'Mostarda',
];
