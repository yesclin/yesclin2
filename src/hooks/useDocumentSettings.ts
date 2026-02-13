import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface DocumentSettings {
  id: string;
  clinic_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  clinic_name: string | null;
  responsible_name: string | null;
  responsible_crm: string | null;
  show_crm: boolean;
  show_footer: boolean;
  footer_text: string | null;
  header_style: 'simple' | 'stripe';
  show_digital_signature: boolean;
  signature_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentSettingsInput {
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  clinic_name?: string | null;
  responsible_name?: string | null;
  responsible_crm?: string | null;
  show_crm: boolean;
  show_footer: boolean;
  footer_text?: string | null;
  header_style: 'simple' | 'stripe';
  show_digital_signature: boolean;
  signature_image_url?: string | null;
}

export const DOCUMENT_DEFAULTS: DocumentSettingsInput = {
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  clinic_name: null,
  responsible_name: null,
  responsible_crm: null,
  show_crm: true,
  show_footer: true,
  footer_text: 'Documento gerado eletronicamente pelo YesClin',
  header_style: 'simple',
  show_digital_signature: false,
  logo_url: null,
  signature_image_url: null,
};

export function useDocumentSettings() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [settings, setSettings] = useState<DocumentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_document_settings')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();
      if (error) throw error;
      setSettings(data as DocumentSettings | null);
    } catch (err) {
      console.error('Error fetching document settings:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchSettings();
    }
  }, [clinicLoading, clinic?.id, fetchSettings]);

  const save = async (input: DocumentSettingsInput): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const payload = {
        clinic_id: clinic.id,
        ...input,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('clinic_document_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinic_document_settings')
          .insert(payload);
        if (error) throw error;
      }

      await fetchSettings();
      toast.success('Configurações de documentos salvas');
      return true;
    } catch (err) {
      console.error('Error saving document settings:', err);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!clinic?.id) return null;
    try {
      const ext = file.name.split('.').pop();
      const path = `${clinic.id}/${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('document-assets')
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('document-assets')
        .getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao fazer upload');
      return null;
    }
  };

  return {
    settings,
    defaults: DOCUMENT_DEFAULTS,
    loading: loading || clinicLoading,
    saving,
    save,
    uploadFile,
    fetchSettings,
    clinicName: clinic?.name || null,
  };
}
