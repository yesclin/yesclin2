/**
 * NUTRIÇÃO - Visão Geral
 * 
 * Hook para dados da visão geral do paciente na especialidade Nutrição.
 * Inclui peso atual, IMC, objetivo nutricional e resumo do acompanhamento.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

export type ObjetivoNutricional = 'perda_peso' | 'ganho_massa' | 'manutencao' | 'reeducacao' | 'outro';

export interface NutricaoPatientData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
}

export interface NutricaoSummaryData {
  // Dados atuais
  peso_atual_kg: number | null;
  altura_cm: number | null;
  imc: number | null;
  classificacao_imc: string | null;
  
  // Objetivo
  objetivo: ObjetivoNutricional | null;
  peso_meta_kg: number | null;
  
  // Estatísticas
  total_consultas: number;
  ultima_consulta: string | null;
  variacao_peso_kg: number | null; // Desde o início do acompanhamento
  
  // Plano alimentar ativo
  plano_ativo: boolean;
  data_inicio_plano: string | null;
}

export interface LastMeasurement {
  id: string;
  measurement_date: string;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  body_fat_percent: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
}

/**
 * Calcula a classificação do IMC segundo a OMS
 */
function classifyBMI(bmi: number | null): string | null {
  if (bmi === null) return null;
  
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidade grau I';
  if (bmi < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

/**
 * Hook para buscar dados da visão geral nutricional do paciente
 */
export function useVisaoGeralNutricaoData(patientId: string | null) {
  const { clinic } = useClinicData();
  
  // Buscar dados do paciente
  const {
    data: patient,
    isLoading: patientLoading,
  } = useQuery({
    queryKey: ['nutricao-patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone, email')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return data as NutricaoPatientData;
    },
    enabled: !!patientId,
  });
  
  // Buscar última medição corporal
  const {
    data: lastMeasurement,
    isLoading: measurementLoading,
  } = useQuery({
    queryKey: ['nutricao-last-measurement', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return null;
      
      const { data, error } = await supabase
        .from('body_measurements')
        .select('id, measurement_date, weight_kg, height_cm, bmi, body_fat_percent, waist_cm, hip_cm')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('measurement_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as LastMeasurement | null;
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar primeira medição para calcular variação
  const {
    data: firstMeasurement,
    isLoading: firstMeasurementLoading,
  } = useQuery({
    queryKey: ['nutricao-first-measurement', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return null;
      
      const { data, error } = await supabase
        .from('body_measurements')
        .select('weight_kg, measurement_date')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('measurement_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar estatísticas de consultas
  const {
    data: appointmentStats,
    isLoading: appointmentStatsLoading,
  } = useQuery({
    queryKey: ['nutricao-appointment-stats', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return { total: 0, ultima: null };
      
      // Buscar total de consultas finalizadas
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('status', 'finalizado');
      
      if (countError) throw countError;
      
      // Buscar última consulta
      const { data: lastAppt, error: lastError } = await supabase
        .from('appointments')
        .select('scheduled_date')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('status', 'finalizado')
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastError) throw lastError;
      
      return {
        total: count || 0,
        ultima: lastAppt?.scheduled_date || null,
      };
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Calcular resumo
  const summary: NutricaoSummaryData = {
    peso_atual_kg: lastMeasurement?.weight_kg || null,
    altura_cm: lastMeasurement?.height_cm || null,
    imc: lastMeasurement?.bmi || null,
    classificacao_imc: classifyBMI(lastMeasurement?.bmi || null),
    objetivo: null, // TODO: Implementar quando tivermos tabela de objetivos
    peso_meta_kg: null,
    total_consultas: appointmentStats?.total || 0,
    ultima_consulta: appointmentStats?.ultima || null,
    variacao_peso_kg: 
      lastMeasurement?.weight_kg && firstMeasurement?.weight_kg
        ? Number((lastMeasurement.weight_kg - firstMeasurement.weight_kg).toFixed(1))
        : null,
    plano_ativo: false, // TODO: Implementar quando tivermos tabela de planos
    data_inicio_plano: null,
  };
  
  return {
    patient,
    summary,
    lastMeasurement,
    loading: patientLoading || measurementLoading || firstMeasurementLoading || appointmentStatsLoading,
  };
}
