import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface WhatsAppIntegration {
  id: string;
  clinic_id: string;
  channel: string;
  provider: string;
  phone_number_id: string | null;
  business_account_id: string | null;
  access_token: string | null;
  status: 'active' | 'invalid' | 'not_configured';
  display_phone_number: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppFormData {
  provider: string;
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  display_phone_number: string;
}

export function useWhatsAppIntegration() {
  const { clinic } = useClinicData();
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchIntegration = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinic_channel_integrations')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('channel', 'whatsapp')
        .maybeSingle();

      if (error) throw error;
      setIntegration(data as WhatsAppIntegration | null);
    } catch (err) {
      console.error('Error fetching WhatsApp integration:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  const saveIntegration = async (formData: WhatsAppFormData) => {
    if (!clinic?.id) return;
    setSaving(true);
    try {
      const payload = {
        clinic_id: clinic.id,
        channel: 'whatsapp',
        provider: formData.provider,
        phone_number_id: formData.phone_number_id || null,
        business_account_id: formData.business_account_id || null,
        access_token: formData.access_token || null,
        display_phone_number: formData.display_phone_number || null,
        status: formData.phone_number_id && formData.access_token ? 'active' : 'not_configured',
      };

      if (integration?.id) {
        const { error } = await supabase
          .from('clinic_channel_integrations')
          .update(payload)
          .eq('id', integration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinic_channel_integrations')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Integração WhatsApp salva com sucesso');
      await fetchIntegration();
    } catch (err: any) {
      console.error('Error saving WhatsApp integration:', err);
      toast.error('Erro ao salvar integração: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const disconnectIntegration = async () => {
    if (!integration?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinic_channel_integrations')
        .update({
          status: 'not_configured',
          phone_number_id: null,
          business_account_id: null,
          access_token: null,
          display_phone_number: null,
        })
        .eq('id', integration.id);
      if (error) throw error;
      toast.success('WhatsApp desconectado');
      await fetchIntegration();
    } catch (err: any) {
      toast.error('Erro ao desconectar: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return {
    integration,
    loading,
    saving,
    saveIntegration,
    disconnectIntegration,
    refetch: fetchIntegration,
    isConfigured: integration?.status === 'active',
  };
}
