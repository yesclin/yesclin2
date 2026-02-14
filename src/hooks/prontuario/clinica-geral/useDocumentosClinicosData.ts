import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type TipoDocumentoClinico = 'receituario' | 'atestado';
export type StatusDocumentoClinico = 'emitido' | 'cancelado';

export interface MedicamentoItem {
  nome: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  observacoes?: string;
}

export interface ConteudoReceituario {
  medicamentos: MedicamentoItem[];
  observacoes_gerais?: string;
}

export interface ConteudoAtestado {
  tipo_afastamento: 'dias' | 'periodo';
  dias?: number;
  data_inicio?: string;
  data_fim?: string;
  cid?: string;
  observacao?: string;
}

export interface DocumentoClinico {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  specialty_id: string | null;
  tipo: TipoDocumentoClinico;
  conteudo_json: ConteudoReceituario | ConteudoAtestado;
  status: StatusDocumentoClinico;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profissional_nome?: string;
}

interface UseDocumentosClinicosDataResult {
  documentos: DocumentoClinico[];
  loading: boolean;
  saving: boolean;
  currentProfessionalId: string | null;
  currentProfessionalName: string | null;
  saveDocumento: (tipo: TipoDocumentoClinico, conteudo: ConteudoReceituario | ConteudoAtestado, specialtyId?: string) => Promise<string | null>;
  cancelDocumento: (id: string, motivo: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useDocumentosClinicosData(patientId: string | null): UseDocumentosClinicosDataResult {
  const { clinic } = useClinicData();
  const [documentos, setDocumentos] = useState<DocumentoClinico[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProfessionalId, setCurrentProfessionalId] = useState<string | null>(null);
  const [currentProfessionalName, setCurrentProfessionalName] = useState<string | null>(null);

  // Get current professional
  useEffect(() => {
    async function fetchProfessional() {
      if (!clinic?.id) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data: prof } = await supabase
        .from('professionals')
        .select('id, user_id')
        .eq('clinic_id', clinic.id)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (prof) {
        setCurrentProfessionalId(prof.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', prof.user_id!)
          .maybeSingle();
        setCurrentProfessionalName(profile?.full_name || null);
      }
    }
    fetchProfessional();
  }, [clinic?.id]);

  const fetchDocumentos = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setDocumentos([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_clinicos')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch professional names
      const profIds = [...new Set((data || []).map(d => d.professional_id).filter(Boolean))];
      let profNames: Record<string, string> = {};
      if (profIds.length > 0) {
        const { data: profs } = await supabase
          .from('professionals')
          .select('id, user_id')
          .in('id', profIds);
        const userIds = (profs || []).map(p => p.user_id).filter(Boolean) as string[];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          const userMap: Record<string, string> = {};
          (profiles || []).forEach(p => { if (p.user_id && p.full_name) userMap[p.user_id] = p.full_name; });
          (profs || []).forEach(p => { if (p.id && p.user_id && userMap[p.user_id]) profNames[p.id] = userMap[p.user_id]; });
        }
      }

      setDocumentos((data || []).map(d => ({
        id: d.id,
        clinic_id: d.clinic_id,
        patient_id: d.patient_id,
        professional_id: d.professional_id,
        specialty_id: d.specialty_id,
        tipo: d.tipo as TipoDocumentoClinico,
        conteudo_json: (typeof d.conteudo_json === 'string' ? JSON.parse(d.conteudo_json) : d.conteudo_json) as ConteudoReceituario | ConteudoAtestado,
        status: d.status as StatusDocumentoClinico,
        pdf_url: d.pdf_url,
        created_at: d.created_at,
        updated_at: d.updated_at,
        profissional_nome: profNames[d.professional_id] || undefined,
      })));
    } catch (err) {
      console.error('Error fetching documentos clínicos:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => { fetchDocumentos(); }, [fetchDocumentos]);

  const saveDocumento = useCallback(async (
    tipo: TipoDocumentoClinico,
    conteudo: ConteudoReceituario | ConteudoAtestado,
    specialtyId?: string,
  ): Promise<string | null> => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados do profissional não encontrados');
      return null;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('documentos_clinicos')
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
          professional_id: currentProfessionalId,
          specialty_id: specialtyId || null,
          tipo,
          conteudo_json: conteudo as any,
          status: 'emitido',
        })
        .select('id')
        .single();

      if (error) throw error;
      toast.success(tipo === 'receituario' ? 'Receituário emitido com sucesso' : 'Atestado emitido com sucesso');
      await fetchDocumentos();
      return data.id;
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, fetchDocumentos]);

  const cancelDocumento = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('documentos_clinicos')
        .update({
          status: 'cancelado',
          cancelado_em: new Date().toISOString(),
          cancelado_por: userData?.user?.id || null,
          motivo_cancelamento: motivo,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Documento cancelado');
      await fetchDocumentos();
      return true;
    } catch (err: any) {
      toast.error(`Erro ao cancelar: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchDocumentos]);

  return {
    documentos,
    loading,
    saving,
    currentProfessionalId,
    currentProfessionalName,
    saveDocumento,
    cancelDocumento,
    refetch: fetchDocumentos,
  };
}
