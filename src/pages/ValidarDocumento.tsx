import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';

interface DocumentInfo {
  id: string;
  document_type: string;
  document_reference: string;
  patient_name: string | null;
  professional_name: string | null;
  is_revoked: boolean;
  created_at: string;
  clinic_id: string;
  clinic_name?: string;
}

const TYPE_LABELS: Record<string, string> = {
  anamnese: 'Anamnese',
  receita: 'Receita',
  atestado: 'Atestado',
  evolucao: 'Evolução Clínica',
  relatorio: 'Relatório',
};

export default function ValidarDocumento() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      if (!id) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from('clinical_documents')
        .select('id, document_type, document_reference, patient_name, professional_name, is_revoked, created_at, clinic_id')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Get clinic name
      const { data: clinic } = await supabase
        .from('clinics')
        .select('name')
        .eq('id', data.clinic_id)
        .maybeSingle();

      setDoc({ ...data, clinic_name: clinic?.name || 'Clínica' });
      setLoading(false);
    }
    fetchDocument();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Documento não encontrado</h1>
          <p className="text-gray-500 text-sm">
            O documento solicitado não existe em nosso sistema. Verifique o código e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  const isValid = doc && !doc.is_revoked;
  const dateFormatted = doc ? format(new Date(doc.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center ${isValid ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
          {isValid ? (
            <CheckCircle className="mx-auto h-16 w-16 mb-3" />
          ) : (
            <XCircle className="mx-auto h-16 w-16 mb-3" />
          )}
          <h1 className="text-xl font-bold">
            {isValid ? 'Documento Válido' : 'Documento Revogado'}
          </h1>
          <p className="text-sm opacity-90 mt-1">
            {isValid
              ? 'Este documento foi emitido e validado digitalmente.'
              : 'Este documento foi revogado e não possui mais validade.'}
          </p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Tipo de Documento</p>
              <p className="font-medium text-gray-900">{TYPE_LABELS[doc!.document_type] || doc!.document_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Número</p>
              <p className="font-mono font-medium text-gray-900 text-sm">{doc!.document_reference}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Data de Emissão</p>
              <p className="font-medium text-gray-900 text-sm">{dateFormatted}</p>
            </div>
          </div>

          {doc!.clinic_name && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Clínica</p>
              <p className="font-medium text-gray-900">{doc!.clinic_name}</p>
            </div>
          )}

          {doc!.patient_name && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Paciente</p>
              <p className="font-medium text-gray-900">{doc!.patient_name}</p>
            </div>
          )}

          {doc!.professional_name && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Profissional Responsável</p>
              <p className="font-medium text-gray-900">{doc!.professional_name}</p>
            </div>
          )}

          <div className="pt-2 border-t text-center">
            <p className="text-xs text-gray-400">
              Validação digital • YesClin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
