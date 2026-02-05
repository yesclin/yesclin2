 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useClinicData } from '@/hooks/useClinicData';
 import { toast } from 'sonner';
 import type { AestheticConsentRecord, ConsentType } from '@/components/prontuario/aesthetics/types';
 
 // Default consent templates
 export const DEFAULT_CONSENT_TEMPLATES: Record<ConsentType, { title: string; content: string }> = {
   toxin: {
     title: 'Termo de Consentimento - Toxina Botulínica',
     content: `TERMO DE CONSENTIMENTO INFORMADO PARA APLICAÇÃO DE TOXINA BOTULÍNICA
 
 Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre o procedimento de aplicação de toxina botulínica, seus benefícios, riscos e alternativas.
 
 INDICAÇÕES:
 O procedimento é indicado para suavização de rugas dinâmicas faciais, tratamento de hiperidrose e outras condições médicas.
 
 PROCEDIMENTO:
 A toxina botulínica será injetada nos músculos previamente definidos, causando relaxamento temporário da musculatura tratada.
 
 EFEITOS ESPERADOS:
 O início do efeito ocorre entre 48-72 horas após a aplicação, com resultado máximo em 15-30 dias. A duração média é de 4-6 meses.
 
 RISCOS E COMPLICAÇÕES POSSÍVEIS:
 - Dor, edema e equimose no local da aplicação
 - Cefaleia transitória
 - Ptose palpebral ou assimetria temporária
 - Reações alérgicas (raras)
 
 RECOMENDAÇÕES PÓS-PROCEDIMENTO:
 - Não massagear a área tratada por 4 horas
 - Evitar atividades físicas intensas por 24 horas
 - Não deitar por 4 horas após o procedimento
 
 Declaro que li, compreendi e concordo com as informações acima.`,
   },
   filler: {
     title: 'Termo de Consentimento - Preenchimento Facial',
     content: `TERMO DE CONSENTIMENTO INFORMADO PARA PREENCHIMENTO FACIAL
 
 Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre o procedimento de preenchimento facial com ácido hialurônico ou similar.
 
 INDICAÇÕES:
 Restauração de volume, harmonização facial, tratamento de sulcos e rugas estáticas.
 
 PROCEDIMENTO:
 O preenchedor será injetado nas áreas previamente definidas, proporcionando volume e sustentação aos tecidos.
 
 RESULTADOS ESPERADOS:
 Resultado imediato com melhora progressiva em até 30 dias. Duração média de 12-18 meses dependendo do produto e área tratada.
 
 RISCOS E COMPLICAÇÕES POSSÍVEIS:
 - Edema, equimose e dor local
 - Assimetria
 - Nódulos ou granulomas
 - Infecção local
 - Necrose tecidual (rara)
 - Embolia vascular (muito rara)
 
 RECOMENDAÇÕES PÓS-PROCEDIMENTO:
 - Aplicar gelo nas primeiras 24 horas
 - Evitar exposição solar intensa por 48 horas
 - Evitar maquiagem por 12 horas
 
 Declaro que li, compreendi e concordo com as informações acima.`,
   },
   biostimulator: {
     title: 'Termo de Consentimento - Bioestimulador de Colágeno',
     content: `TERMO DE CONSENTIMENTO INFORMADO PARA BIOESTIMULADOR DE COLÁGENO
 
 Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre o procedimento de aplicação de bioestimulador de colágeno.
 
 INDICAÇÕES:
 Estímulo à produção de colágeno, melhora da qualidade da pele, tratamento de flacidez cutânea.
 
 PROCEDIMENTO:
 O bioestimulador será injetado na derme ou subdérmico, estimulando a produção natural de colágeno pelo organismo.
 
 RESULTADOS ESPERADOS:
 Resultado progressivo em 60-90 dias, com melhora contínua. Podem ser necessárias múltiplas sessões. Duração média de 18-24 meses.
 
 RISCOS E COMPLICAÇÕES POSSÍVEIS:
 - Edema, equimose e dor local
 - Nódulos (especialmente se técnica incorreta)
 - Assimetria
 - Hipersensibilidade
 
 RECOMENDAÇÕES PÓS-PROCEDIMENTO:
 - Massagear a área conforme orientação por 5-7 dias
 - Evitar atividades físicas intensas por 24 horas
 - Hidratação adequada
 
 Declaro que li, compreendi e concordo com as informações acima.`,
   },
   general: {
     title: 'Termo de Consentimento Geral - Procedimentos Estéticos',
     content: `TERMO DE CONSENTIMENTO GERAL PARA PROCEDIMENTOS ESTÉTICOS
 
 Eu, paciente abaixo identificado, declaro que fui devidamente informado(a) sobre os procedimentos estéticos que serão realizados.
 
 Declaro estar ciente de que:
 1. Todo procedimento estético possui riscos inerentes
 2. Fui informado sobre alternativas de tratamento
 3. Forneci todas as informações sobre minha saúde de forma verdadeira
 4. Estou ciente das recomendações pré e pós-procedimento
 
 Declaro que li, compreendi e concordo com as informações acima.`,
   },
 };
 
 export function useAestheticConsent(patientId: string | null) {
   const { clinic } = useClinicData();
   const queryClient = useQueryClient();
 
   const queryKey = ['aesthetic-consent', patientId];
 
   // Fetch consent records
   const { data: consents = [], isLoading } = useQuery({
     queryKey,
     queryFn: async () => {
       if (!patientId || !clinic?.id) return [];
 
       const { data, error } = await supabase
         .from('aesthetic_consent_records')
         .select('*')
         .eq('clinic_id', clinic.id)
         .eq('patient_id', patientId)
         .order('accepted_at', { ascending: false });
 
       if (error) {
         console.error('Error fetching consents:', error);
         throw error;
       }
 
       return data as AestheticConsentRecord[];
     },
     enabled: !!patientId && !!clinic?.id,
   });
 
   // Check if consent exists for a specific type
   const hasConsentForType = (type: ConsentType): boolean => {
     return consents.some(c => c.consent_type === type);
   };
 
   // Get latest consent for type
   const getLatestConsentForType = (type: ConsentType): AestheticConsentRecord | undefined => {
     return consents.find(c => c.consent_type === type);
   };
 
   // Create consent record
   const createConsentMutation = useMutation({
     mutationFn: async (data: {
       consent_type: ConsentType;
       appointment_id?: string;
       signature_data?: string;
       custom_content?: string;
     }) => {
       if (!patientId || !clinic?.id) throw new Error('Missing required data');
 
       const { data: userData } = await supabase.auth.getUser();
       const template = DEFAULT_CONSENT_TEMPLATES[data.consent_type];
 
       const { data: result, error } = await supabase
         .from('aesthetic_consent_records')
         .insert({
           clinic_id: clinic.id,
           patient_id: patientId,
           appointment_id: data.appointment_id || null,
           consent_type: data.consent_type,
           term_title: template.title,
           term_content: data.custom_content || template.content,
           term_version: '1.0',
           signature_data: data.signature_data || null,
           ip_address: null, // Could capture from request
           user_agent: navigator.userAgent,
           created_by: userData.user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return result;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey });
       toast.success('Termo aceito com sucesso');
     },
     onError: (error) => {
       console.error('Error creating consent:', error);
       toast.error('Erro ao registrar consentimento');
     },
   });
 
   return {
     consents,
     isLoading,
     hasConsentForType,
     getLatestConsentForType,
     createConsent: createConsentMutation.mutateAsync,
     isCreating: createConsentMutation.isPending,
     templates: DEFAULT_CONSENT_TEMPLATES,
   };
 }