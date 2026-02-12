import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrintData {
  clinic: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    logo_url?: string | null;
    cnpj?: string | null;
  };
  patient: {
    full_name: string;
    birth_date?: string | null;
    gender?: string | null;
    phone?: string | null;
    cpf?: string | null;
  };
  appointment?: {
    id: string;
    scheduled_date: string;
    professional_name?: string;
    specialty_name?: string;
  };
  anamnese?: Record<string, unknown> | null;
  exameFisico?: Array<Record<string, unknown>>;
  diagnosticos?: Array<Record<string, unknown>>;
  condutas?: Array<Record<string, unknown>>;
  evolucoes?: Array<Record<string, unknown>>;
  prescricoes?: Array<Record<string, unknown>>;
}

export function useProntuarioPrint() {
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handlePrint = useCallback((printData: PrintData) => {
    setPrinting(true);

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Não foi possível abrir a janela de impressão. Verifique se popups estão permitidos.');
        setPrinting(false);
        return;
      }

      const today = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const appointmentDate = printData.appointment?.scheduled_date
        ? format(new Date(printData.appointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR })
        : today;

      const age = printData.patient.birth_date
        ? `${Math.floor((Date.now() - new Date(printData.patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} anos`
        : '';

      const genderMap: Record<string, string> = { M: 'Masculino', F: 'Feminino', male: 'Masculino', female: 'Feminino', masculino: 'Masculino', feminino: 'Feminino' };
      const gender = printData.patient.gender ? (genderMap[printData.patient.gender] || printData.patient.gender) : '';

      // Build sections HTML
      let sectionsHtml = '';

      // Anamnese
      if (printData.anamnese && Object.keys(printData.anamnese).length > 0) {
        sectionsHtml += `<div class="section"><h2>Anamnese</h2>`;
        const anamnese = printData.anamnese as Record<string, unknown>;
        
        // Try structured data first
        if (anamnese.queixa_principal || anamnese.chief_complaint) {
          sectionsHtml += `<div class="field"><strong>Queixa Principal:</strong> ${anamnese.queixa_principal || anamnese.chief_complaint || ''}</div>`;
        }
        if (anamnese.historia_doenca_atual || anamnese.current_disease_history) {
          sectionsHtml += `<div class="field"><strong>HDA:</strong> ${anamnese.historia_doenca_atual || anamnese.current_disease_history || ''}</div>`;
        }
        if (anamnese.historia_patologica) {
          sectionsHtml += `<div class="field"><strong>HPP:</strong> ${anamnese.historia_patologica}</div>`;
        }
        if (anamnese.historia_familiar || anamnese.family_history) {
          sectionsHtml += `<div class="field"><strong>História Familiar:</strong> ${anamnese.historia_familiar || anamnese.family_history || ''}</div>`;
        }
        if (anamnese.medicamentos || anamnese.current_medications) {
          const meds = anamnese.medicamentos || anamnese.current_medications;
          sectionsHtml += `<div class="field"><strong>Medicamentos:</strong> ${Array.isArray(meds) ? meds.join(', ') : meds}</div>`;
        }
        if (anamnese.alergias || anamnese.allergies) {
          const allergies = anamnese.alergias || anamnese.allergies;
          sectionsHtml += `<div class="field"><strong>Alergias:</strong> ${Array.isArray(allergies) ? allergies.join(', ') : allergies}</div>`;
        }
        if (anamnese.habitos) {
          sectionsHtml += `<div class="field"><strong>Hábitos:</strong> ${typeof anamnese.habitos === 'object' ? JSON.stringify(anamnese.habitos) : anamnese.habitos}</div>`;
        }
        if (anamnese.revisao_sistemas) {
          sectionsHtml += `<div class="field"><strong>Revisão de Sistemas:</strong> ${anamnese.revisao_sistemas}</div>`;
        }

        // Fallback: render all string values
        const renderedKeys = new Set(['queixa_principal', 'chief_complaint', 'historia_doenca_atual', 'current_disease_history', 'historia_patologica', 'historia_familiar', 'family_history', 'medicamentos', 'current_medications', 'alergias', 'allergies', 'habitos', 'revisao_sistemas', 'id', 'patient_id', 'version', 'is_active', 'created_by', 'created_at', 'updated_by', 'updated_at', 'custom_fields', 'created_by_name', 'updated_by_name']);
        for (const [key, value] of Object.entries(anamnese)) {
          if (!renderedKeys.has(key) && value && typeof value === 'string') {
            sectionsHtml += `<div class="field"><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</div>`;
          }
        }
        sectionsHtml += `</div>`;
      }

      // Exame Físico
      if (printData.exameFisico && printData.exameFisico.length > 0) {
        sectionsHtml += `<div class="section"><h2>Exame Físico</h2>`;
        for (const exame of printData.exameFisico) {
          if (exame.general_state) sectionsHtml += `<div class="field"><strong>Estado Geral:</strong> ${exame.general_state}</div>`;
          if (exame.blood_pressure) sectionsHtml += `<div class="field"><strong>PA:</strong> ${exame.blood_pressure}</div>`;
          if (exame.heart_rate) sectionsHtml += `<div class="field"><strong>FC:</strong> ${exame.heart_rate} bpm</div>`;
          if (exame.temperature) sectionsHtml += `<div class="field"><strong>Temp:</strong> ${exame.temperature}°C</div>`;
          if (exame.respiratory_rate) sectionsHtml += `<div class="field"><strong>FR:</strong> ${exame.respiratory_rate} irpm</div>`;
          if (exame.spo2) sectionsHtml += `<div class="field"><strong>SpO2:</strong> ${exame.spo2}%</div>`;
          if (exame.observations) sectionsHtml += `<div class="field"><strong>Observações:</strong> ${exame.observations}</div>`;
          if (exame.notes) sectionsHtml += `<div class="field"><strong>Notas:</strong> ${exame.notes}</div>`;
        }
        sectionsHtml += `</div>`;
      }

      // Diagnósticos
      if (printData.diagnosticos && printData.diagnosticos.length > 0) {
        sectionsHtml += `<div class="section"><h2>Hipótese Diagnóstica</h2><ul>`;
        for (const diag of printData.diagnosticos) {
          sectionsHtml += `<li><strong>${diag.cid_code || ''}</strong> - ${diag.description || diag.name || ''} ${diag.status ? `(${diag.status})` : ''}</li>`;
        }
        sectionsHtml += `</ul></div>`;
      }

      // Condutas
      if (printData.condutas && printData.condutas.length > 0) {
        sectionsHtml += `<div class="section"><h2>Plano / Conduta</h2>`;
        for (const conduta of printData.condutas) {
          if (conduta.plan) sectionsHtml += `<div class="field"><strong>Plano:</strong> ${conduta.plan}</div>`;
          if (conduta.conduct) sectionsHtml += `<div class="field"><strong>Conduta:</strong> ${conduta.conduct}</div>`;
          if (conduta.observations) sectionsHtml += `<div class="field"><strong>Observações:</strong> ${conduta.observations}</div>`;
          if (conduta.return_date) sectionsHtml += `<div class="field"><strong>Retorno:</strong> ${conduta.return_date}</div>`;
        }
        sectionsHtml += `</div>`;
      }

      // Evoluções
      if (printData.evolucoes && printData.evolucoes.length > 0) {
        sectionsHtml += `<div class="section"><h2>Evoluções Clínicas</h2>`;
        for (const evo of printData.evolucoes) {
          const content = evo.content as Record<string, unknown> | undefined;
          sectionsHtml += `<div class="evolution-entry">`;
          if (evo.created_at) sectionsHtml += `<div class="field"><em>${format(new Date(evo.created_at as string), "dd/MM/yyyy HH:mm", { locale: ptBR })}</em></div>`;
          if (content) {
            if (content.subjective) sectionsHtml += `<div class="field"><strong>S:</strong> ${content.subjective}</div>`;
            if (content.objective) sectionsHtml += `<div class="field"><strong>O:</strong> ${content.objective}</div>`;
            if (content.assessment) sectionsHtml += `<div class="field"><strong>A:</strong> ${content.assessment}</div>`;
            if (content.plan) sectionsHtml += `<div class="field"><strong>P:</strong> ${content.plan}</div>`;
          }
          if (evo.notes) sectionsHtml += `<div class="field"><strong>Notas:</strong> ${evo.notes}</div>`;
          sectionsHtml += `</div>`;
        }
        sectionsHtml += `</div>`;
      }

      // Prescrições
      if (printData.prescricoes && printData.prescricoes.length > 0) {
        sectionsHtml += `<div class="section"><h2>Prescrições</h2>`;
        for (const presc of printData.prescricoes) {
          sectionsHtml += `<div class="field">${presc.medication || presc.description || ''} — ${presc.dosage || ''} ${presc.frequency || ''}</div>`;
        }
        sectionsHtml += `</div>`;
      }

      if (!sectionsHtml) {
        sectionsHtml = '<div class="section"><p style="color:#888;">Nenhum dado clínico registrado neste prontuário.</p></div>';
      }

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Prontuário - ${printData.patient.full_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; padding: 20mm 15mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; }
    .clinic-info { flex: 1; }
    .clinic-name { font-size: 16pt; font-weight: 700; color: #0d9488; }
    .clinic-details { font-size: 9pt; color: #555; margin-top: 4px; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 14pt; color: #333; font-weight: 600; }
    .doc-title .date { font-size: 9pt; color: #777; }
    .patient-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
    .patient-box .name { font-size: 13pt; font-weight: 600; color: #0f766e; }
    .patient-box .details { font-size: 9pt; color: #555; margin-top: 4px; }
    .section { margin-bottom: 14px; page-break-inside: avoid; }
    .section h2 { font-size: 12pt; color: #0d9488; border-bottom: 1px solid #ccfbf1; padding-bottom: 4px; margin-bottom: 8px; font-weight: 600; }
    .field { margin-bottom: 4px; font-size: 10pt; }
    .field strong { color: #333; }
    .evolution-entry { border-left: 3px solid #99f6e4; padding-left: 10px; margin-bottom: 10px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; font-size: 10pt; }
    .footer { position: fixed; bottom: 10mm; left: 15mm; right: 15mm; border-top: 1px solid #ddd; padding-top: 6px; font-size: 8pt; color: #999; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 10mm; }
      .footer { position: fixed; bottom: 5mm; left: 10mm; right: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-info">
      <div class="clinic-name">${printData.clinic.name}</div>
      <div class="clinic-details">
        ${printData.clinic.cnpj ? `CNPJ: ${printData.clinic.cnpj}` : ''}
        ${printData.clinic.phone ? ` • Tel: ${printData.clinic.phone}` : ''}
        ${printData.clinic.email ? ` • ${printData.clinic.email}` : ''}
        ${printData.clinic.address ? `<br>${printData.clinic.address}` : ''}
      </div>
    </div>
    <div class="doc-title">
      <h1>PRONTUÁRIO CLÍNICO</h1>
      <div class="date">Data: ${appointmentDate}</div>
      ${printData.appointment?.professional_name ? `<div class="date">Profissional: ${printData.appointment.professional_name}</div>` : ''}
      ${printData.appointment?.specialty_name ? `<div class="date">Especialidade: ${printData.appointment.specialty_name}</div>` : ''}
    </div>
  </div>

  <div class="patient-box">
    <div class="name">${printData.patient.full_name}</div>
    <div class="details">
      ${age ? `Idade: ${age}` : ''}
      ${gender ? ` • Sexo: ${gender}` : ''}
      ${printData.patient.cpf ? ` • CPF: ${printData.patient.cpf}` : ''}
      ${printData.patient.phone ? ` • Tel: ${printData.patient.phone}` : ''}
    </div>
  </div>

  ${sectionsHtml}

  <div class="footer">
    <span>Documento gerado em ${today}</span>
    <span>${printData.clinic.name}</span>
  </div>
</body>
</html>`;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        // Don't close immediately - user may cancel
      };
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Erro ao preparar impressão');
    } finally {
      setPrinting(false);
    }
  }, []);

  const handleExport = useCallback(async (
    patientId: string,
    appointmentId?: string,
    patientName?: string,
  ) => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const params = new URLSearchParams();
      if (appointmentId) params.set('appointmentId', appointmentId);
      params.set('patientId', patientId);

      const response = await supabase.functions.invoke('export-prontuario', {
        body: { patientId, appointmentId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao exportar PDF');
      }

      // Response contains base64 PDF
      const pdfData = response.data;
      if (!pdfData?.pdf) {
        throw new Error('PDF não gerado');
      }

      // Decode base64 and download
      const byteCharacters = atob(pdfData.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const safeName = (patientName || 'paciente').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const fileName = `prontuario_${safeName}_${dateStr}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar prontuário. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }, []);

  return { handlePrint, handleExport, printing, exporting };
}
