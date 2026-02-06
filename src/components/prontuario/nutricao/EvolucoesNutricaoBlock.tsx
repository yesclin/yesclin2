/**
 * NUTRIÇÃO - Evoluções
 * 
 * Bloco para registro de evoluções clínicas nutricionais.
 * Inclui adesão ao plano, queixas e orientações.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Plus, 
  Save,
  FileSignature,
  Calendar,
  User,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TIPO_CONSULTA_LABELS,
  SINTOMAS_GI_OPTIONS,
  type EvolucaoNutricao, 
  type EvolucaoNutricaoFormData,
  type TipoConsulta
} from '@/hooks/prontuario/nutricao';

interface EvolucoesNutricaoBlockProps {
  evolucoes: EvolucaoNutricao[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: EvolucaoNutricaoFormData, appointmentId?: string) => Promise<unknown>;
  onSign: (evolucaoId: string) => Promise<boolean>;
}

const initialFormData: EvolucaoNutricaoFormData = {
  tipo_consulta: 'acompanhamento',
  queixa_principal: null,
  peso_atual_kg: null,
  observacoes_peso: null,
  adesao_plano: null,
  dificuldades_relatadas: null,
  sintomas_gi: [],
  avaliacao: null,
  ajustes_realizados: null,
  orientacoes: [],
  proximos_passos: null,
};

export function EvolucoesNutricaoBlock({
  evolucoes,
  loading,
  saving,
  canEdit,
  onSave,
  onSign,
}: EvolucoesNutricaoBlockProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EvolucaoNutricaoFormData>(initialFormData);
  const [newOrientacao, setNewOrientacao] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSave(formData);
    if (result) {
      setFormData(initialFormData);
      setShowForm(false);
    }
  };

  const updateField = <K extends keyof EvolucaoNutricaoFormData>(field: K, value: EvolucaoNutricaoFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSintoma = (sintoma: string) => {
    setFormData(prev => ({
      ...prev,
      sintomas_gi: prev.sintomas_gi.includes(sintoma)
        ? prev.sintomas_gi.filter(s => s !== sintoma)
        : [...prev.sintomas_gi, sintoma],
    }));
  };

  const addOrientacao = () => {
    if (newOrientacao.trim()) {
      updateField('orientacoes', [...formData.orientacoes, newOrientacao.trim()]);
      setNewOrientacao('');
    }
  };

  const removeOrientacao = (index: number) => {
    updateField('orientacoes', formData.orientacoes.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Evoluções Nutricionais</h2>
        </div>
        {canEdit && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Evolução Nutricional
          </Button>
        )}
      </div>

      {/* Formulário */}
      {showForm && canEdit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Evolução Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo e Peso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tipo_consulta">Tipo de Consulta</Label>
                  <Select
                    value={formData.tipo_consulta}
                    onValueChange={(value: TipoConsulta) => updateField('tipo_consulta', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_CONSULTA_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="peso_atual_kg">Peso Atual (kg)</Label>
                  <Input
                    id="peso_atual_kg"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.5"
                    value={formData.peso_atual_kg ?? ''}
                    onChange={(e) => updateField('peso_atual_kg', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="adesao_plano">Adesão ao Plano</Label>
                  <Select
                    value={formData.adesao_plano ?? ''}
                    onValueChange={(value: 'boa' | 'regular' | 'ruim') => updateField('adesao_plano', value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boa">Boa</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="ruim">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Queixa e Dificuldades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="queixa_principal">Queixa Principal</Label>
                  <Textarea
                    id="queixa_principal"
                    placeholder="Descreva a queixa do paciente..."
                    value={formData.queixa_principal ?? ''}
                    onChange={(e) => updateField('queixa_principal', e.target.value || null)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="dificuldades_relatadas">Dificuldades Relatadas</Label>
                  <Textarea
                    id="dificuldades_relatadas"
                    placeholder="Dificuldades em seguir o plano..."
                    value={formData.dificuldades_relatadas ?? ''}
                    onChange={(e) => updateField('dificuldades_relatadas', e.target.value || null)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Sintomas GI */}
              <div>
                <Label className="mb-2">Sintomas Gastrointestinais</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {SINTOMAS_GI_OPTIONS.map((sintoma) => (
                    <div key={sintoma} className="flex items-center space-x-2">
                      <Checkbox
                        id={sintoma}
                        checked={formData.sintomas_gi.includes(sintoma)}
                        onCheckedChange={() => toggleSintoma(sintoma)}
                      />
                      <label htmlFor={sintoma} className="text-sm cursor-pointer">
                        {sintoma}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avaliação */}
              <div>
                <Label htmlFor="avaliacao">Avaliação / Observações</Label>
                <Textarea
                  id="avaliacao"
                  placeholder="Avaliação geral do atendimento..."
                  value={formData.avaliacao ?? ''}
                  onChange={(e) => updateField('avaliacao', e.target.value || null)}
                  rows={3}
                />
              </div>

              {/* Ajustes Realizados */}
              <div>
                <Label htmlFor="ajustes_realizados">Ajustes Realizados no Plano</Label>
                <Textarea
                  id="ajustes_realizados"
                  placeholder="Descreva os ajustes feitos no plano alimentar..."
                  value={formData.ajustes_realizados ?? ''}
                  onChange={(e) => updateField('ajustes_realizados', e.target.value || null)}
                  rows={2}
                />
              </div>

              {/* Orientações */}
              <div>
                <Label className="mb-2">Orientações</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Adicionar orientação..."
                    value={newOrientacao}
                    onChange={(e) => setNewOrientacao(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOrientacao())}
                  />
                  <Button type="button" variant="outline" onClick={addOrientacao}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.orientacoes.map((orientacao, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {orientacao}
                      <button
                        type="button"
                        onClick={() => removeOrientacao(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Próximos passos */}
              <div>
                <Label htmlFor="proximos_passos">Próximos Passos</Label>
                <Textarea
                  id="proximos_passos"
                  placeholder="O que fazer até a próxima consulta..."
                  value={formData.proximos_passos ?? ''}
                  onChange={(e) => updateField('proximos_passos', e.target.value || null)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Rascunho'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Evoluções */}
      {evolucoes.length > 0 && (
        <div className="space-y-3">
          {evolucoes.map((evolucao) => (
            <Card key={evolucao.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{TIPO_CONSULTA_LABELS[evolucao.tipo_consulta]}</Badge>
                    {evolucao.status === 'signed' ? (
                      <Badge variant="default" className="bg-primary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Assinada
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Rascunho
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(evolucao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Info do profissional */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  {evolucao.professional_name}
                </div>

                {/* Dados da evolução */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {evolucao.peso_atual_kg && (
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="font-medium">{evolucao.peso_atual_kg} kg</p>
                    </div>
                  )}
                  {evolucao.adesao_plano && (
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Adesão</p>
                      <p className="font-medium capitalize">{evolucao.adesao_plano}</p>
                    </div>
                  )}
                </div>

                {/* Queixa */}
                {evolucao.queixa_principal && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Queixa Principal</p>
                    <p className="text-sm">{evolucao.queixa_principal}</p>
                  </div>
                )}

                {/* Sintomas GI */}
                {evolucao.sintomas_gi.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sintomas GI</p>
                    <div className="flex flex-wrap gap-1">
                      {evolucao.sintomas_gi.map((sintoma, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {sintoma}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avaliação */}
                {evolucao.avaliacao && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avaliação</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">{evolucao.avaliacao}</p>
                  </div>
                )}

                {/* Ajustes Realizados */}
                {evolucao.ajustes_realizados && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ajustes Realizados</p>
                    <p className="text-sm bg-primary/5 p-2 rounded border-l-2 border-primary">{evolucao.ajustes_realizados}</p>
                  </div>
                )}

                {/* Orientações */}
                {evolucao.orientacoes.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Orientações Reforçadas</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {evolucao.orientacoes.map((orientacao, index) => (
                        <li key={index}>{orientacao}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ação de assinar */}
                {evolucao.status === 'draft' && canEdit && (
                  <div className="pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onSign(evolucao.id)}
                    >
                      <FileSignature className="h-4 w-4 mr-2" />
                      Assinar Evolução
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {evolucoes.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Nenhuma evolução nutricional registrada.</p>
            <p className="text-muted-foreground text-sm mb-4">Registre a primeira evolução nutricional deste paciente.</p>
            {canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Evolução
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
