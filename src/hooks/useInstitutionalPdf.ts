import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { useDocumentSettings, DOCUMENT_DEFAULTS, type DocumentSettings } from '@/hooks/useDocumentSettings';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SecaoAnamnese } from '@/hooks/prontuario/clinica-geral/anamneseTemplates';
import {
  generateHash,
  getNextDocumentNumber,
  buildDocumentReference,
  generateValidationQRCode,
  registerClinicalDocument,
} from '@/utils/documentControl';
import { logAudit } from '@/utils/auditLog';

interface PatientInfo {
  name: string;
  cpf?: string;
  birth_date?: string;
  phone?: string;
}

interface AnamneseForPdf {
  id: string;
  structured_data?: Record<string, unknown>;
  queixa_principal?: string;
  historia_doenca_atual?: string;
  antecedentes_pessoais?: string;
  antecedentes_familiares?: string;
  habitos_vida?: string;
  medicamentos_uso_continuo?: string;
  alergias?: string;
  comorbidades?: string;
  created_at: string;
  created_by_name?: string;
  template_id?: string;
}

function buildContentHtml(
  pc: string,
  anamnese: AnamneseForPdf,
  sections: SecaoAnamnese[],
): string {
  let contentHtml = '';

  if (anamnese.structured_data && Object.keys(anamnese.structured_data).length > 0) {
    for (const secao of sections) {
      const fields = secao.campos.filter(c => {
        const v = anamnese.structured_data![c.id];
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== '';
      });
      if (fields.length === 0) continue;

      contentHtml += `<div style="margin-bottom:14px;">
        <h3 style="color:${pc};font-size:13px;margin:0 0 6px 0;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">${secao.titulo}</h3>`;

      for (const campo of fields) {
        const val = anamnese.structured_data![campo.id];
        const display = Array.isArray(val) ? val.join(', ') : String(val);
        contentHtml += `<div style="margin-bottom:6px;">
          <span style="font-size:10px;color:#6b7280;display:block;">${campo.label}</span>
          <span style="font-size:12px;">${display}</span>
        </div>`;
      }
      contentHtml += '</div>';
    }
  } else {
    const legacyFields = [
      { label: 'Queixa Principal', value: anamnese.queixa_principal },
      { label: 'História da Doença Atual', value: anamnese.historia_doenca_atual },
      { label: 'Antecedentes Pessoais', value: anamnese.antecedentes_pessoais },
      { label: 'Antecedentes Familiares', value: anamnese.antecedentes_familiares },
      { label: 'Hábitos de Vida', value: anamnese.habitos_vida },
      { label: 'Medicamentos', value: anamnese.medicamentos_uso_continuo },
      { label: 'Alergias', value: anamnese.alergias },
      { label: 'Comorbidades', value: anamnese.comorbidades },
    ].filter(f => f.value);

    for (const f of legacyFields) {
      contentHtml += `<div style="margin-bottom:10px;">
        <h3 style="color:${pc};font-size:13px;margin:0 0 4px 0;">${f.label}</h3>
        <p style="font-size:12px;margin:0;white-space:pre-wrap;">${f.value}</p>
      </div>`;
    }
  }

  return contentHtml;
}

function buildHtml(
  settings: DocumentSettings | null,
  patient: PatientInfo,
  anamnese: AnamneseForPdf,
  sections: SecaoAnamnese[],
  docReference?: string,
  docId?: string,
  qrCodeDataUrl?: string,
): string {
  const s = settings || (DOCUMENT_DEFAULTS as unknown as DocumentSettings);
  const pc = s.primary_color || '#6366f1';
  const clinicName = s.clinic_name || 'Clínica';
  const dateStr = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const contentHtml = buildContentHtml(pc, anamnese, sections);

  // Build header
  let headerHtml = '';
  if (s.header_style === 'stripe') {
    headerHtml = `<div style="background:${pc};color:white;padding:16px 20px;display:flex;align-items:center;gap:12px;">
      ${s.logo_url ? `<img src="${s.logo_url}" style="height:48px;width:48px;border-radius:6px;object-fit:cover;background:rgba(255,255,255,0.2);" />` : ''}
      <div>
        <div style="font-weight:bold;font-size:16px;">${clinicName}</div>
        ${s.responsible_name ? `<div style="font-size:11px;opacity:0.9;">${s.responsible_name}</div>` : ''}
        ${s.show_crm && s.responsible_crm ? `<div style="font-size:10px;opacity:0.8;">CRM: ${s.responsible_crm}</div>` : ''}
      </div>
    </div>`;
  } else {
    headerHtml = `<div style="padding:16px 20px;border-bottom:2px solid ${pc};display:flex;align-items:center;gap:12px;">
      ${s.logo_url ? `<img src="${s.logo_url}" style="height:48px;width:48px;border-radius:6px;object-fit:cover;border:1px solid #e5e7eb;" />` : ''}
      <div>
        <div style="font-weight:bold;font-size:16px;color:${pc};">${clinicName}</div>
        ${s.responsible_name ? `<div style="font-size:11px;color:#4b5563;">${s.responsible_name}</div>` : ''}
        ${s.show_crm && s.responsible_crm ? `<div style="font-size:10px;color:#6b7280;">CRM: ${s.responsible_crm}</div>` : ''}
      </div>
    </div>`;
  }

  // Footer with document control
  let footerHtml = '';
  if (s.show_footer || docReference) {
    const signatureBlock = s.show_digital_signature && s.signature_image_url
      ? `<img src="${s.signature_image_url}" style="height:40px;object-fit:contain;" />`
      : '';

    const controlBlock = docReference
      ? `<div style="display:flex;align-items:center;gap:10px;margin-top:6px;">
          ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width:60px;height:60px;" />` : ''}
          <div style="font-size:8px;color:#9ca3af;line-height:1.4;">
            <div><strong>Nº:</strong> ${docReference}</div>
            ${docId ? `<div><strong>Código:</strong> ${docId.substring(0, 8)}...</div>` : ''}
            <div>Documento com validação digital</div>
          </div>
        </div>`
      : '';

    footerHtml = `<div style="border-top:1px solid #e5e7eb;padding:10px 20px;display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;">
      <div>
        <div style="font-size:9px;color:#9ca3af;">${s.footer_text || ''}<br/>Gerado em: ${dateStr}</div>
        ${controlBlock}
      </div>
      ${signatureBlock}
    </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color:#1f2937; }
  </style></head><body>
    <div style="min-height:100vh;display:flex;flex-direction:column;">
      ${headerHtml}
      <div style="padding:12px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:10px;color:#6b7280;font-weight:600;">DADOS DO PACIENTE</div>
        <div style="font-size:11px;margin-top:2px;">
          <strong>${patient.name}</strong>
          ${patient.cpf ? ` • CPF: ${patient.cpf}` : ''}
          ${patient.birth_date ? ` • Nasc: ${patient.birth_date}` : ''}
        </div>
      </div>
      <div style="text-align:center;padding:10px;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:bold;font-size:14px;color:${pc};letter-spacing:1px;">ANAMNESE</div>
        ${docReference ? `<div style="font-size:9px;color:#9ca3af;margin-top:2px;">${docReference}</div>` : ''}
      </div>
      <div style="padding:16px 20px;flex:1;">
        ${contentHtml}
      </div>
      ${footerHtml}
    </div>
  </body></html>`;
}

export function useInstitutionalPdf() {
  const { clinic } = useClinicData();
  const { settings } = useDocumentSettings();
  const [generating, setGenerating] = useState(false);

  const generateAnamnesisPdf = useCallback(async (
    patient: PatientInfo & { id?: string },
    anamnese: AnamneseForPdf,
    sections: SecaoAnamnese[],
  ) => {
    setGenerating(true);
    try {
      let docReference: string | undefined;
      let docId: string | undefined;
      let qrCodeDataUrl: string | undefined;

      // Document control: get sequential number and prepare QR code
      if (clinic?.id && patient.id) {
        try {
          const seqNum = await getNextDocumentNumber(clinic.id);
          docReference = buildDocumentReference('anamnese', seqNum);
        } catch (err) {
          console.warn('Could not get sequential number, continuing without:', err);
        }
      }

      // Build HTML (first pass without QR to get hash)
      const htmlForHash = buildHtml(settings, patient, anamnese, sections, docReference);
      const documentHash = await generateHash(htmlForHash);

      // Register document to get UUID for QR code
      if (clinic?.id && patient.id && docReference) {
        try {
          const registered = await registerClinicalDocument({
            clinicId: clinic.id,
            patientId: patient.id,
            documentType: 'anamnese',
            documentReference: docReference,
            documentHash,
            sourceRecordId: anamnese.id,
            patientName: patient.name,
            professionalName: anamnese.created_by_name || settings?.responsible_name || undefined,
          });
          docId = registered.id;
          qrCodeDataUrl = await generateValidationQRCode(docId);
          
          // Audit log for document creation
          await logAudit({
            clinicId: clinic.id,
            action: 'document_created',
            entityType: 'clinical_document',
            entityId: docId,
            metadata: {
              document_reference: docReference,
              document_type: 'anamnese',
              patient_name: patient.name,
            },
          });
        } catch (err) {
          console.warn('Could not register document, continuing without:', err);
        }
      }

      // Build final HTML with QR code
      const html = buildHtml(settings, patient, anamnese, sections, docReference, docId, qrCodeDataUrl);

      // Render HTML to canvas
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '794px';
      container.innerHTML = html;
      document.body.appendChild(container);

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Save to storage
      const pdfBlob = pdf.output('blob');
      const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
      const fileName = `anamnese_${safeName}_${dateStr}.pdf`;
      const storagePath = `${clinic?.id}/${anamnese.id}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('generated-documents')
        .upload(storagePath, pdfBlob, { contentType: 'application/pdf' });

      if (uploadErr) {
        console.warn('Storage upload error (saving locally):', uploadErr);
      }

      // Update document record with PDF URL if registered
      if (docId && !uploadErr) {
        const { data: urlData } = supabase.storage
          .from('generated-documents')
          .getPublicUrl(storagePath);
        if (urlData?.publicUrl) {
          await supabase
            .from('clinical_documents')
            .update({ pdf_url: urlData.publicUrl })
            .eq('id', docId);
        }
      }

      // Register in patient history
      if (clinic?.id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('patient_generated_documents').insert({
            patient_id: anamnese.id,
            clinic_id: clinic.id,
            document_type: 'anamnese',
            title: `Anamnese - ${patient.name}${docReference ? ` (${docReference})` : ''}`,
            file_path: storagePath,
            file_name: fileName,
            generated_by: user.id,
            source_record_id: anamnese.id,
          });
        }
      }

      // Download
      pdf.save(fileName);
      toast.success(`PDF institucional gerado! ${docReference || ''}`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }, [settings, clinic?.id]);

  return { generateAnamnesisPdf, generating, hasSettings: !!settings };
}
