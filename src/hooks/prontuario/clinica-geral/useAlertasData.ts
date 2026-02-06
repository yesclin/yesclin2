import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { AlertaClinico, TipoAlerta, SeveridadeAlerta } from '@/components/prontuario/clinica-geral/AlertasBlock';

interface UseAlertasDataResult {
  alertas: AlertaClinico[];
  activeAlertas: AlertaClinico[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  currentProfessionalId: string | null;
  currentProfessionalName: string | null;
  saveAlerta: (data: {
    alert_type: TipoAlerta;
    severity: SeveridadeAlerta;
    title: string;
    description?: string;
  }) => Promise<void>;
  deactivateAlerta: (id: string) => Promise<void>;
  reactivateAlerta: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar Alertas Clínicos
 * 
 * Permite criar e gerenciar alertas de alergias, doenças crônicas e riscos clínicos.
 */
export function useAlertasData(patientId: string | null): UseAlertasDataResult {
  const { clinic } = useClinicData();
  const [alertas, setAlertas] = useState<AlertaClinico[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProfessionalId, setCurrentProfessionalId] = useState<string | null>(null);
  const [currentProfessionalName, setCurrentProfessionalName] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user's professional info
  useEffect(() => {
    const fetchCurrentProfessional = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clinic?.id) return;

      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('clinic_id', clinic.id)
        .single();

      if (professional) {
        setCurrentProfessionalId(professional.id);
      }
      if (profile) {
        setCurrentProfessionalName(profile.full_name || null);
      }
    };

    fetchCurrentProfessional();
  }, [clinic?.id]);

  const fetchAlertas = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setAlertas([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get creator names
      const creatorIds = [...new Set((data || []).map(a => a.created_by).filter(Boolean))];
      let creatorsMap: Record<string, string> = {};

      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);

        if (profiles) {
          profiles.forEach(p => {
            if (p.user_id && p.full_name) {
              creatorsMap[p.user_id] = p.full_name;
            }
          });
        }
      }

      const mapped: AlertaClinico[] = (data || []).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        created_by: item.created_by || undefined,
        created_by_nome: item.created_by ? creatorsMap[item.created_by] : undefined,
        alert_type: (item.alert_type as TipoAlerta) || 'other',
        severity: (item.severity as SeveridadeAlerta) || 'info',
        title: item.title,
        description: item.description || undefined,
        is_active: item.is_active ?? true,
        expires_at: item.expires_at || undefined,
        created_at: item.created_at,
      }));

      setAlertas(mapped);

    } catch (err) {
      console.error('Error fetching alertas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar alertas');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveAlerta = useCallback(async (data: {
    alert_type: TipoAlerta;
    severity: SeveridadeAlerta;
    title: string;
    description?: string;
  }) => {
    if (!patientId || !clinic?.id) {
      toast.error('Dados do paciente não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('clinical_alerts')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          created_by: currentUserId,
          alert_type: data.alert_type,
          severity: data.severity,
          title: data.title,
          description: data.description || null,
          is_active: true,
        });

      if (insertError) throw insertError;

      toast.success('Alerta clínico registrado!');
      await fetchAlertas();

    } catch (err) {
      console.error('Error saving alerta:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar alerta';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentUserId, fetchAlertas]);

  const deactivateAlerta = useCallback(async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_alerts')
        .update({ 
          is_active: false,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: currentUserId,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Alerta desativado');
      await fetchAlertas();

    } catch (err) {
      console.error('Error deactivating alerta:', err);
      toast.error('Erro ao desativar alerta');
    }
  }, [currentUserId, fetchAlertas]);

  const reactivateAlerta = useCallback(async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('clinical_alerts')
        .update({ 
          is_active: true,
          acknowledged_at: null,
          acknowledged_by: null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Alerta reativado');
      await fetchAlertas();

    } catch (err) {
      console.error('Error reactivating alerta:', err);
      toast.error('Erro ao reativar alerta');
    }
  }, [fetchAlertas]);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  const activeAlertas = alertas.filter(a => a.is_active);

  return {
    alertas,
    activeAlertas,
    loading,
    saving,
    error,
    currentProfessionalId,
    currentProfessionalName,
    saveAlerta,
    deactivateAlerta,
    reactivateAlerta,
    refetch: fetchAlertas,
  };
}
