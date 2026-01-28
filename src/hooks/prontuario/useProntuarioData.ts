import { useState, useEffect, useCallback } from 'react';
import { useProntuarioConfig } from './useProntuarioConfig';
import { useMedicalRecordEntries, MedicalRecordEntry } from './useMedicalRecordEntries';
import { useMedicalRecordFiles, MedicalRecordFile } from './useMedicalRecordFiles';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import type { TabConfig } from './useTabs';
import type { Field } from './useFields';

export interface PatientRecord {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  cpf: string | null;
}

export interface ClinicalAlert {
  id: string;
  patient_id: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Combined hook that provides all data for the Prontuario usage module.
 * It connects configuration (from Configurações > Prontuário) with actual patient data.
 */
export function useProntuarioData(patientId: string | null) {
  const { clinic } = useClinicData();
  const config = useProntuarioConfig();
  const entriesHook = useMedicalRecordEntries();
  const filesHook = useMedicalRecordFiles();

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);

  // Fetch patient data
  const fetchPatient = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    setPatientLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone, email, cpf')
        .eq('id', patientId)
        .eq('clinic_id', clinic.id)
        .single();

      if (error) throw error;
      setPatient(data as PatientRecord);
    } catch (err) {
      console.error('Error fetching patient:', err);
      setPatient(null);
    } finally {
      setPatientLoading(false);
    }
  }, [patientId, clinic?.id]);

  // Fetch clinical alerts
  const fetchAlerts = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    try {
      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('severity', { ascending: true });

      if (error) throw error;
      setAlerts((data as ClinicalAlert[]) || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, [patientId, clinic?.id]);

  // Load all data when patient changes
  useEffect(() => {
    if (patientId) {
      fetchPatient();
      fetchAlerts();
      entriesHook.fetchEntriesForPatient(patientId);
      filesHook.fetchFilesForPatient(patientId);
    }
  }, [patientId]);

  // Get active tabs from configuration
  const getActiveTabs = useCallback((): TabConfig[] => {
    return config.tabs.filter((t) => t.is_active).sort((a, b) => a.display_order - b.display_order);
  }, [config.tabs]);

  // Get template fields for creating new entries
  const getFieldsForTemplate = useCallback(async (templateId: string): Promise<Field[]> => {
    return config.getTemplateFields(templateId);
  }, [config]);

  // Create a new entry using a template
  const createEntryFromTemplate = useCallback(async (
    templateId: string,
    professionalId: string,
    content: Record<string, unknown>,
    appointmentId?: string
  ): Promise<string | null> => {
    if (!patientId) return null;

    const template = config.templates.find((t) => t.id === templateId);

    return entriesHook.createEntry({
      patient_id: patientId,
      professional_id: professionalId,
      template_id: templateId,
      appointment_id: appointmentId || null,
      entry_type: template?.type || 'evolution',
      content,
    });
  }, [patientId, config.templates, entriesHook]);

  // Get entries filtered by type (matching tabs)
  const getEntriesForTab = useCallback((tabKey: string): MedicalRecordEntry[] => {
    const typeMapping: Record<string, string[]> = {
      evolucao: ['evolution'],
      anamnese: ['anamnesis'],
      diagnostico: ['diagnosis'],
      prescricoes: ['prescription'],
      procedimentos: ['procedure'],
    };

    const types = typeMapping[tabKey] || [];
    if (types.length === 0) return entriesHook.entries;

    return entriesHook.entries.filter((e) => types.includes(e.entry_type));
  }, [entriesHook.entries]);

  // Get files by category for tabs
  const getFilesForTab = useCallback((tabKey: string): MedicalRecordFile[] => {
    const categoryMapping: Record<string, string[]> = {
      exames: ['exam', 'report'],
      documentos: ['document', 'consent', 'prescription'],
      imagens: ['image'],
    };

    const categories = categoryMapping[tabKey];
    if (!categories) return filesHook.files;

    return filesHook.files.filter((f) => categories.includes(f.category));
  }, [filesHook.files]);

  // Active alerts
  const activeAlerts = alerts.filter((a) => a.is_active);
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

  return {
    // Patient data
    patient,
    patientLoading,
    fetchPatient,

    // Configuration
    config,
    getActiveTabs,
    getFieldsForTemplate,

    // Entries
    entries: entriesHook.entries,
    entriesLoading: entriesHook.loading,
    entriesSaving: entriesHook.saving,
    createEntry: entriesHook.createEntry,
    createEntryFromTemplate,
    updateEntry: entriesHook.updateEntry,
    signEntry: entriesHook.signEntry,
    deleteEntry: entriesHook.deleteEntry,
    getEntriesForTab,

    // Files
    files: filesHook.files,
    filesLoading: filesHook.loading,
    filesSaving: filesHook.saving,
    uploadFile: filesHook.uploadFile,
    deleteFile: filesHook.deleteFile,
    getFilesForTab,
    getImages: filesHook.getImages,
    getDocuments: filesHook.getDocuments,

    // Alerts
    alerts,
    activeAlerts,
    criticalAlerts,
    fetchAlerts,

    // Loading state
    loading: patientLoading || config.loading || entriesHook.loading || filesHook.loading,
  };
}
