import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  generateHash,
  getNextDocumentNumber,
  buildDocumentReference,
  generateValidationQRCode,
  registerClinicalDocument,
} from '@/utils/documentControl';

export interface ReportSection {
  key: string;
  title: string;
  content: string;
  visible: boolean;
  confidential?: boolean;
}

export interface RelatorioPsicologicoAggregated {
  patientName: string;
  patientBirthDate: string | null;
  patientGender: string | null;
  professionalName: string;
  professionalRegistration: string;
  periodStart: string;
  periodEnd: string;
  totalSessions: number;
  sessionDates: string[];
  queixaPrincipal: string;
  evolucaoPercebida: string[];
  tecnicasUtilizadas: string[];
  encaminhamentos: string[];
  objetivosTerapeuticos: string;
  metasCurto: string;
  metasMedio: string;
  metasLongo: string;
  abordagemTerapeutica: string;
  modalidade: string;
  riscosRegistrados: string[];
  // Confidential fields (not included by default)
  observacoesConfidenciais: string[];
  riscoInterno: string[];
}

interface UseRelatorioPsicologicoDataResult {
  loading: boolean;
  saving: boolean;
  aggregateReportData: (
    patientId: string,
    periodStart: string,
    periodEnd: string,
    includeConfidential: boolean,
  ) => Promise<{ sections: ReportSection[]; aggregated: RelatorioPsicologicoAggregated } | null>;
  saveReport: (params: {
    patientId: string;
    sections: ReportSection[];
    professionalName: string;
    patientName: string;
  }) => Promise<string | null>;
}

export function useRelatorioPsicologicoData(): UseRelatorioPsicologicoDataResult {
  const { clinic } = useClinicData();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const aggregateReportData = useCallback(
    async (
      patientId: string,
      periodStart: string,
      periodEnd: string,
      includeConfidential: boolean,
    ) => {
      if (!clinic?.id) return null;
      setLoading(true);

      try {
        // 1) Patient data
        const { data: patient } = await supabase
          .from('patients')
          .select('full_name, birth_date, gender')
          .eq('id', patientId)
          .eq('clinic_id', clinic.id)
          .single();

        if (!patient) throw new Error('Paciente não encontrado');

        // 2) Current professional
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        let professionalName = '';
        let professionalRegistration = '';
        if (userId) {
          const { data: prof } = await supabase
            .from('professionals')
            .select('full_name, registration_number')
            .eq('user_id', userId)
            .eq('clinic_id', clinic.id)
            .eq('is_active', true)
            .single();
          if (prof) {
            professionalName = prof.full_name || '';
            professionalRegistration = prof.registration_number || '';
          }
        }

        // 3) Sessions in period
        const { data: sessoes } = await supabase
          .from('sessoes_psicologia')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .gte('data_sessao', periodStart)
          .lte('data_sessao', periodEnd)
          .order('data_sessao', { ascending: true });

        const sessionsList = sessoes || [];

        // 4) Anamnese (current)
        const { data: anamneses } = await supabase
          .from('patient_anamnese_psicologia')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .eq('is_current', true)
          .limit(1);

        const anamnese = anamneses?.[0] || null;

        // 5) Plano terapêutico (current)
        const { data: planos } = await supabase
          .from('plano_terapeutico_psicologia')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id)
          .eq('is_current', true)
          .limit(1);

        const plano = planos?.[0] || null;

        // Aggregate data
        const evolucaoSet = new Set<string>();
        const tecnicasSet = new Set<string>();
        const encaminhamentosSet = new Set<string>();
        const sessionDates: string[] = [];
        const observacoesConf: string[] = [];
        const riscoInterno: string[] = [];
        const riscosReg: string[] = [];

        sessionsList.forEach((s: any) => {
          sessionDates.push(s.data_sessao);
          if (s.evolucao_caso) evolucaoSet.add(s.evolucao_caso);
          if (s.intervencoes_tags && Array.isArray(s.intervencoes_tags)) {
            s.intervencoes_tags.forEach((t: string) => tecnicasSet.add(t));
          }
          if (s.encaminhamentos_tags && Array.isArray(s.encaminhamentos_tags)) {
            s.encaminhamentos_tags.forEach((e: string) => {
              if (e !== 'Nenhum') encaminhamentosSet.add(e);
            });
          }
          if (s.risco_atual && s.risco_atual !== 'ausente') {
            riscosReg.push(`Sessão ${s.numero_sessao || '?'}: Risco ${s.risco_atual}`);
          }
          // Confidential
          if (s.observacoes_terapeuta) observacoesConf.push(s.observacoes_terapeuta);
          if (s.risco_interno) riscoInterno.push(s.risco_interno);
        });

        const aggregated: RelatorioPsicologicoAggregated = {
          patientName: patient.full_name || '',
          patientBirthDate: patient.birth_date,
          patientGender: patient.gender,
          professionalName,
          professionalRegistration,
          periodStart,
          periodEnd,
          totalSessions: sessionsList.length,
          sessionDates,
          queixaPrincipal: anamnese?.queixa_principal || 'Não informada na anamnese.',
          evolucaoPercebida: Array.from(evolucaoSet),
          tecnicasUtilizadas: Array.from(tecnicasSet),
          encaminhamentos: Array.from(encaminhamentosSet),
          objetivosTerapeuticos: plano?.objetivos_terapeuticos || '',
          metasCurto: plano?.metas_curto_prazo || '',
          metasMedio: plano?.metas_medio_prazo || '',
          metasLongo: plano?.metas_longo_prazo || '',
          abordagemTerapeutica: anamnese?.abordagem_terapeutica || plano?.estrategias_intervencao || '',
          modalidade: anamnese?.modalidade || 'presencial',
          riscosRegistrados: riscosReg,
          observacoesConfidenciais: observacoesConf,
          riscoInterno,
        };

        const fmtDate = (d: string) => {
          try {
            return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
          } catch {
            return d;
          }
        };

        // Build sections
        const sections: ReportSection[] = [
          {
            key: 'identificacao',
            title: '1. Identificação',
            content: [
              `Nome: ${aggregated.patientName}`,
              aggregated.patientBirthDate ? `Data de Nascimento: ${fmtDate(aggregated.patientBirthDate)}` : '',
              aggregated.patientGender ? `Sexo: ${aggregated.patientGender}` : '',
              `Período do Relatório: ${fmtDate(periodStart)} a ${fmtDate(periodEnd)}`,
              `Total de Sessões no Período: ${aggregated.totalSessions}`,
              `Modalidade: ${aggregated.modalidade === 'presencial' ? 'Presencial' : aggregated.modalidade === 'online' ? 'Online' : aggregated.modalidade}`,
            ].filter(Boolean).join('\n'),
            visible: true,
          },
          {
            key: 'motivo',
            title: '2. Motivo do Atendimento',
            content: aggregated.queixaPrincipal,
            visible: true,
          },
          {
            key: 'processo',
            title: '3. Processo Terapêutico',
            content: [
              aggregated.abordagemTerapeutica ? `Abordagem: ${aggregated.abordagemTerapeutica}` : '',
              aggregated.objetivosTerapeuticos ? `\nObjetivos Terapêuticos:\n${aggregated.objetivosTerapeuticos}` : '',
              aggregated.metasCurto ? `\nMetas de Curto Prazo:\n${aggregated.metasCurto}` : '',
              aggregated.metasMedio ? `\nMetas de Médio Prazo:\n${aggregated.metasMedio}` : '',
              aggregated.metasLongo ? `\nMetas de Longo Prazo:\n${aggregated.metasLongo}` : '',
              aggregated.tecnicasUtilizadas.length > 0
                ? `\nTécnicas Utilizadas: ${aggregated.tecnicasUtilizadas.join(', ')}`
                : '',
            ].filter(Boolean).join('\n'),
            visible: true,
          },
          {
            key: 'evolucao',
            title: '4. Evolução Observada',
            content: aggregated.evolucaoPercebida.length > 0
              ? aggregated.evolucaoPercebida.map((e, i) => `• ${e}`).join('\n')
              : 'Sem registros de evolução no período selecionado.',
            visible: true,
          },
          {
            key: 'consideracoes',
            title: '5. Considerações Técnicas',
            content: [
              aggregated.riscosRegistrados.length > 0
                ? `Riscos registrados no período:\n${aggregated.riscosRegistrados.map(r => `• ${r}`).join('\n')}`
                : 'Sem riscos significativos registrados no período.',
              includeConfidential && aggregated.observacoesConfidenciais.length > 0
                ? `\n\nObservações do Terapeuta:\n${aggregated.observacoesConfidenciais.map(o => `• ${o}`).join('\n')}`
                : '',
            ].filter(Boolean).join('\n'),
            visible: true,
            confidential: includeConfidential,
          },
          {
            key: 'encaminhamentos',
            title: '6. Encaminhamentos',
            content: aggregated.encaminhamentos.length > 0
              ? aggregated.encaminhamentos.map(e => `• ${e}`).join('\n')
              : 'Sem encaminhamentos registrados no período.',
            visible: true,
          },
          {
            key: 'conclusao',
            title: '7. Conclusão',
            content: `O(A) paciente ${aggregated.patientName} realizou ${aggregated.totalSessions} sessão(ões) de acompanhamento psicológico no período de ${fmtDate(periodStart)} a ${fmtDate(periodEnd)}. ${
              aggregated.evolucaoPercebida.length > 0
                ? 'Foi observada evolução ao longo do processo terapêutico.'
                : 'O processo terapêutico segue em acompanhamento.'
            }`,
            visible: true,
          },
        ];

        return { sections, aggregated };
      } catch (err) {
        console.error('Error aggregating report data:', err);
        toast.error('Erro ao gerar dados do relatório');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clinic?.id],
  );

  const saveReport = useCallback(
    async (params: {
      patientId: string;
      sections: ReportSection[];
      professionalName: string;
      patientName: string;
    }): Promise<string | null> => {
      if (!clinic?.id) return null;
      setSaving(true);

      try {
        const visibleSections = params.sections.filter(s => s.visible);
        const contentString = visibleSections.map(s => `${s.title}\n${s.content}`).join('\n\n');
        const docHash = await generateHash(contentString);

        const seqNum = await getNextDocumentNumber(clinic.id);
        const docReference = buildDocumentReference('relatorio', seqNum);

        const registered = await registerClinicalDocument({
          clinicId: clinic.id,
          patientId: params.patientId,
          documentType: 'relatorio',
          documentReference: docReference,
          documentHash: docHash,
          patientName: params.patientName,
          professionalName: params.professionalName,
        });

        toast.success(`Relatório registrado: ${docReference}`);
        return registered.id;
      } catch (err) {
        console.error('Error saving report:', err);
        toast.error('Erro ao salvar relatório');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [clinic?.id],
  );

  return {
    loading,
    saving,
    aggregateReportData,
    saveReport,
  };
}
