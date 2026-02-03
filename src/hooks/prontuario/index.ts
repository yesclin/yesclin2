// Configuration hooks (for Configurações > Prontuário)
export { useTabs, type TabConfig } from './useTabs';
export { useTemplates, type Template, type TemplateInput, type TemplateType, type TemplateScope } from './useTemplates';
export { useFields, type Field, type FieldInput, type FieldType } from './useFields';
export { useDefaultTemplates } from './useDefaultTemplates';
export { useVisualSettings, type VisualSettings, type VisualSettingsInput, type LayoutMode, type LogoPosition } from './useVisualSettings';
export { useSecurity, type SecuritySettings, type SecurityInput } from './useSecurity';
export { useCustomProntuarioFields, type CustomProntuarioField, type CustomFieldInput, type CustomFieldType } from './useCustomProntuarioFields';

// Usage hooks (for Prontuário module)
export { useProntuarioConfig, type VisualConfig, type SecurityConfig } from './useProntuarioConfig';
export { useMedicalRecordEntries, type MedicalRecordEntry, type EntryInput } from './useMedicalRecordEntries';
export { useMedicalRecordFiles, type MedicalRecordFile, type FileInput } from './useMedicalRecordFiles';
export { useProntuarioData, type PatientRecord, type ClinicalAlert } from './useProntuarioData';
export { useMedicalRecordSignatures, type MedicalRecordSignature } from './useMedicalRecordSignatures';

// Clinical Timeline
export { useClinicalTimeline } from './useClinicalTimeline';

// Active Appointment (for edit control)
export { useActiveAppointment, useCanEditMedicalRecord, type ActiveAppointment } from './useActiveAppointment';

// Active Specialty (for tab filtering by specialty)
export { useActiveSpecialty, mapSpecialtyNameToKey, type SpecialtyKey, type SpecialtyOption } from './useActiveSpecialty';
export { 
  BASE_TABS, 
  SPECIALTY_TABS, 
  SPECIALTY_LABELS,
  getVisibleTabsForSpecialty, 
  isTabVisibleForSpecialty 
} from './specialtyTabsConfig';

// Permission hooks (for granular access control)
export {
  useMedicalRecordPermissions,
  useCurrentUserMedicalRecordPermissions,
  MEDICAL_RECORD_TABS,
  MEDICAL_RECORD_ACTIONS,
  type TabPermission,
  type ActionPermission,
  type TabKey,
  type ActionKey,
} from './useMedicalRecordPermissions';
