/**
 * PILATES - Bloco de Avaliação de Dor
 * 
 * Registro de localização, intensidade, frequência,
 * fatores de piora/melhora e impacto funcional da dor.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Gauge,
  Plus,
  User,
  Calendar,
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useAvaliacaoDorPilatesData,
  getEmptyAvaliacaoDorForm,
  INTENSIDADE_DOR_OPTIONS,
  FREQUENCIA_DOR_OPTIONS,
  LOCAIS_DOR_OPTIONS,
  FATORES_PIORA_OPTIONS,
  FATORES_MELHORA_OPTIONS,
  IMPACTO_FUNCIONAL_OPTIONS,
  type AvaliacaoDorPilatesFormData,
  type AvaliacaoDorPilatesData,
} from '@/hooks/prontuario/pilates/useAvaliacaoDorPilatesData';

interface AvaliacaoDorPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

function getIntensidadeColor(value: string | null): string {
  if (!value) return 'bg-muted text-muted-foreground';
  if (value === '0') return 'bg-green-500/20 text-green-700 border-green-500/30';
  if (value === '1-3') return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
  if (value === '4-6') return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
  if (value === '7-9') return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
  if (value === '10') return 'bg-red-500/20 text-red-700 border-red-500/30';
  return 'bg-muted text-muted-foreground';
}

/**
 * Formulário de Avaliação de Dor
 */
function AvaliacaoDorForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: AvaliacaoDorPilatesFormData;
  onSubmit: (data: AvaliacaoDorPilatesFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AvaliacaoDorPilatesFormData>(initialData);

  const handleChange = (field: keyof AvaliacaoDorPilatesFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocalToggle = (local: string) => {
    const current = formData.local_da_dor;
    if (current.includes(local)) {
      handleChange('local_da_dor', current.filter(l => l !== local));
    } else {
      handleChange('local_da_dor', [...current, local]);
    }
  };

  const handleFatorPioraToggle = (fator: string) => {
    const current = formData.fatores_de_piora;
    if (current.includes(fator)) {
      handleChange('fatores_de_piora', current.filter(f => f !== fator));
    } else {
      handleChange('fatores_de_piora', [...current, fator]);
    }
  };

  const handleFatorMelhoraToggle = (fator: string) => {
    const current = formData.fatores_de_melhora;
    if (current.includes(fator)) {
      handleChange('fatores_de_melhora', current.filter(f => f !== fator));
    } else {
      handleChange('fatores_de_melhora', [...current, fator]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-6">
          {/* Local da Dor */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Local da Dor
            </Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {LOCAIS_DOR_OPTIONS.map((local) => (
                <div key={local.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`local-${local.value}`}
                    checked={formData.local_da_dor.includes(local.value)}
                    onCheckedChange={() => handleLocalToggle(local.value)}
                  />
                  <label
                    htmlFor={`local-${local.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {local.label}
                  </label>
                </div>
              ))}
            </div>
            {formData.local_da_dor.includes('outro') && (
              <Input
                value={formData.local_da_dor_outro}
                onChange={(e) => handleChange('local_da_dor_outro', e.target.value)}
                placeholder="Especifique o local..."
              />
            )}
          </div>

          {/* Intensidade e Frequência */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                <Gauge className="h-4 w-4 text-primary" />
                Intensidade da Dor (EVA)
              </Label>
              <Select
                value={formData.intensidade_dor}
                onValueChange={(value) => handleChange('intensidade_dor', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {INTENSIDADE_DOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Frequência da Dor</Label>
              <Select
                value={formData.frequencia_dor}
                onValueChange={(value) => handleChange('frequencia_dor', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIA_DOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Início da Dor */}
          <div className="space-y-2">
            <Label htmlFor="inicio_da_dor" className="font-semibold">Início da Dor</Label>
            <Input
              id="inicio_da_dor"
              value={formData.inicio_da_dor}
              onChange={(e) => handleChange('inicio_da_dor', e.target.value)}
              placeholder="Ex: Há 6 meses, após acidente, progressivo..."
            />
          </div>

          {/* Fatores de Piora */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 font-semibold">
              <TrendingUp className="h-4 w-4 text-destructive" />
              Fatores de Piora
            </Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {FATORES_PIORA_OPTIONS.map((fator) => (
                <div key={fator.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`piora-${fator.value}`}
                    checked={formData.fatores_de_piora.includes(fator.value)}
                    onCheckedChange={() => handleFatorPioraToggle(fator.value)}
                  />
                  <label
                    htmlFor={`piora-${fator.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {fator.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Fatores de Melhora */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 font-semibold">
              <TrendingDown className="h-4 w-4 text-primary" />
              Fatores de Melhora
            </Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {FATORES_MELHORA_OPTIONS.map((fator) => (
                <div key={fator.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`melhora-${fator.value}`}
                    checked={formData.fatores_de_melhora.includes(fator.value)}
                    onCheckedChange={() => handleFatorMelhoraToggle(fator.value)}
                  />
                  <label
                    htmlFor={`melhora-${fator.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {fator.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Impacto Funcional */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Impacto Funcional da Dor
            </Label>
            <Select
              value={formData.impacto_funcional_da_dor}
              onValueChange={(value) => handleChange('impacto_funcional_da_dor', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {IMPACTO_FUNCIONAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações Clínicas */}
          <div className="space-y-2">
            <Label htmlFor="observacoes_clinicas_dor" className="font-semibold">
              Observações Clínicas
            </Label>
            <Textarea
              id="observacoes_clinicas_dor"
              value={formData.observacoes_clinicas_dor}
              onChange={(e) => handleChange('observacoes_clinicas_dor', e.target.value)}
              placeholder="Informações complementares sobre a dor, padrão, irradiação, tipo..."
              rows={4}
            />
          </div>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Avaliação de Dor'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de visualização de uma avaliação de dor
 */
function AvaliacaoDorCard({
  avaliacao,
  isLatest = false,
}: {
  avaliacao: AvaliacaoDorPilatesData;
  isLatest?: boolean;
}) {
  const getLocalLabel = (value: string) =>
    LOCAIS_DOR_OPTIONS.find(l => l.value === value)?.label || value;
  const getIntensidadeLabel = (value: string) =>
    INTENSIDADE_DOR_OPTIONS.find(i => i.value === value)?.label || value;
  const getFrequenciaLabel = (value: string) =>
    FREQUENCIA_DOR_OPTIONS.find(f => f.value === value)?.label || value;
  const getImpactoLabel = (value: string) =>
    IMPACTO_FUNCIONAL_OPTIONS.find(i => i.value === value)?.label || value;
  const getFatorPioraLabel = (value: string) =>
    FATORES_PIORA_OPTIONS.find(f => f.value === value)?.label || value;
  const getFatorMelhoraLabel = (value: string) =>
    FATORES_MELHORA_OPTIONS.find(f => f.value === value)?.label || value;

  return (
    <Card className={isLatest ? 'border-l-4 border-l-primary' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(avaliacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {isLatest && <Badge variant="default" className="text-xs">Atual</Badge>}
          </CardTitle>
          {avaliacao.intensidade_dor && (
            <Badge variant="outline" className={getIntensidadeColor(avaliacao.intensidade_dor)}>
              {getIntensidadeLabel(avaliacao.intensidade_dor)}
            </Badge>
          )}
        </div>
        {avaliacao.professional_name && (
          <CardDescription className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {avaliacao.professional_name}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Locais */}
        {avaliacao.local_da_dor.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Local da Dor</p>
            <div className="flex flex-wrap gap-1">
              {avaliacao.local_da_dor.map((local) => (
                <Badge key={local} variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {getLocalLabel(local)}
                </Badge>
              ))}
              {avaliacao.local_da_dor_outro && (
                <Badge variant="secondary" className="text-xs">
                  {avaliacao.local_da_dor_outro}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Frequência e Início */}
        <div className="grid gap-2 sm:grid-cols-2">
          {avaliacao.frequencia_dor && (
            <div>
              <p className="text-xs text-muted-foreground">Frequência</p>
              <p className="text-sm">{getFrequenciaLabel(avaliacao.frequencia_dor)}</p>
            </div>
          )}
          {avaliacao.inicio_da_dor && (
            <div>
              <p className="text-xs text-muted-foreground">Início</p>
              <p className="text-sm">{avaliacao.inicio_da_dor}</p>
            </div>
          )}
        </div>

        {/* Fatores */}
        <div className="grid gap-2 sm:grid-cols-2">
          {avaliacao.fatores_de_piora.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-destructive" /> Piora
              </p>
              <div className="flex flex-wrap gap-1">
                {avaliacao.fatores_de_piora.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs bg-destructive/5">
                    {getFatorPioraLabel(f)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {avaliacao.fatores_de_melhora.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <TrendingDown className="h-3 w-3 text-primary" /> Melhora
              </p>
              <div className="flex flex-wrap gap-1">
                {avaliacao.fatores_de_melhora.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs bg-primary/5">
                    {getFatorMelhoraLabel(f)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Impacto */}
        {avaliacao.impacto_funcional_da_dor && (
          <div>
            <p className="text-xs text-muted-foreground">Impacto Funcional</p>
            <p className="text-sm">{getImpactoLabel(avaliacao.impacto_funcional_da_dor)}</p>
          </div>
        )}

        {/* Observações */}
        {avaliacao.observacoes_clinicas_dor && (
          <div className="p-2 bg-muted/50 rounded text-sm">
            <p className="text-xs text-muted-foreground mb-1">Observações</p>
            {avaliacao.observacoes_clinicas_dor}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AvaliacaoDorPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: AvaliacaoDorPilatesBlockProps) {
  const {
    currentAvaliacao,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao,
    isSaving,
  } = useAvaliacaoDorPilatesData({ patientId, clinicId, professionalId });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um aluno para avaliar a dor.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Avaliação de Dor</h2>
            <p className="text-sm text-muted-foreground">
              {history.length > 0
                ? `${history.length} avaliação(ões) registrada(s)`
                : 'Nenhuma avaliação de dor registrada'}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Avaliação de Dor
          </Button>
        )}
      </div>

      {/* Lista de avaliações */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gauge className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma avaliação de dor registrada para este aluno.
            </p>
            {canEdit && (
              <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((avaliacao, index) => (
            <AvaliacaoDorCard
              key={avaliacao.id}
              avaliacao={avaliacao}
              isLatest={index === 0}
            />
          ))}
        </div>
      )}

      {/* Modal de formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Nova Avaliação de Dor
            </DialogTitle>
            <DialogDescription>
              Registre os dados de dor do aluno para orientar o plano de exercícios.
            </DialogDescription>
          </DialogHeader>
          <AvaliacaoDorForm
            initialData={getEmptyAvaliacaoDorForm()}
            onSubmit={saveAvaliacao}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
