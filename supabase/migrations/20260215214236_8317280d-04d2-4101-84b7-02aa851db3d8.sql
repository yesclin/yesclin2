
-- Table: modelos_prontuario (structured template models)
CREATE TABLE public.modelos_prontuario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especialidade_id UUID REFERENCES public.specialties(id),
  estrutura_json JSONB NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  is_padrao BOOLEAN NOT NULL DEFAULT false,
  is_sistema BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.modelos_prontuario ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view models from their clinic"
  ON public.modelos_prontuario FOR SELECT
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admin can insert models"
  ON public.modelos_prontuario FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admin can update non-system models"
  ON public.modelos_prontuario FOR UPDATE
  USING (
    is_sistema = false AND
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete non-system models"
  ON public.modelos_prontuario FOR DELETE
  USING (
    is_sistema = false AND
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_modelos_prontuario_updated_at
  BEFORE UPDATE ON public.modelos_prontuario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
