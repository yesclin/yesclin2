import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

const DOCUMENT_TYPE_PREFIX: Record<string, string> = {
  anamnese: 'AN',
  receita: 'RC',
  atestado: 'AT',
  evolucao: 'EV',
  relatorio: 'RL',
};

/**
 * Generate a SHA-256 hash of the given content string.
 */
export async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the next sequential document number for a clinic using the atomic DB function.
 */
export async function getNextDocumentNumber(clinicId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_next_document_number', {
    p_clinic_id: clinicId,
  });
  if (error) throw new Error(`Failed to get next document number: ${error.message}`);
  return data as number;
}

/**
 * Build the document reference string, e.g., AN-2026-000001
 */
export function buildDocumentReference(type: string, sequentialNumber: number): string {
  const prefix = DOCUMENT_TYPE_PREFIX[type] || 'DOC';
  const year = new Date().getFullYear();
  const padded = String(sequentialNumber).padStart(6, '0');
  return `${prefix}-${year}-${padded}`;
}

/**
 * Generate a QR code as a data URL for the validation page.
 */
export async function generateValidationQRCode(documentId: string): Promise<string> {
  const baseUrl = window.location.origin;
  const validationUrl = `${baseUrl}/validar/${documentId}`;
  return QRCode.toDataURL(validationUrl, {
    width: 100,
    margin: 1,
    color: { dark: '#1f2937', light: '#ffffff' },
  });
}

interface RegisterDocumentParams {
  clinicId: string;
  patientId: string;
  documentType: 'anamnese' | 'receita' | 'atestado' | 'evolucao' | 'relatorio';
  documentReference: string;
  documentHash: string;
  pdfUrl?: string;
  sourceRecordId?: string;
  patientName?: string;
  professionalName?: string;
}

/**
 * Register a clinical document in the control table.
 * Returns the inserted document record.
 */
export async function registerClinicalDocument(params: RegisterDocumentParams) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { data, error } = await supabase
    .from('clinical_documents')
    .insert({
      clinic_id: params.clinicId,
      patient_id: params.patientId,
      document_type: params.documentType,
      document_reference: params.documentReference,
      document_hash: params.documentHash,
      pdf_url: params.pdfUrl || null,
      source_record_id: params.sourceRecordId || null,
      patient_name: params.patientName || null,
      professional_name: params.professionalName || null,
      created_by: userId || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to register document: ${error.message}`);
  return data;
}
