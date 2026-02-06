/**
 * NUTRIÇÃO - Anamnese Nutricional
 * 
 * Bloco para registro de anamnese nutricional completa.
 * Mantém versionamento - não sobrescreve automaticamente.
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardList, 
  Plus, 
  Save,
  History,
  ChevronDown,
  Calendar,
  User,
  Clock,
  Droplets,
  Pill,
  AlertTriangle,
  Target,
  Utensils,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FREQUENCIA_CONSUMO_LABELS,
  RESTRICOES_ALIMENTARES_OPTIONS,
  INTOLERANCIAS_OPTIONS,
  ALERGIAS_ALIMENTARES_OPTIONS,
  type AnamneseNutricional, 
  type AnamneseNutricionalFormData,
  type FrequenciaConsumo
} from '@/hooks/prontuario/nutricao/useAnamneseNutricionalData';

interface AnamneseNutricionalBlockProps {
  currentAnamnese: AnamneseNutricional | null;
  anamneseHistory: AnamneseNutricional[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: AnamneseNutricionalFormData, professionalId: string) => Promise<unknown>;
  professionalId?: string;
}

const initialFormData: AnamneseNutricionalFormData = {
  queixa_principal: '',
  historico_alimentar: '',
  dietas_anteriores: '',
  rotina_diaria: '',
  horario_acordar: null,
  horario_dormir: null,
  horario_trabalho: null,
  pratica_atividade_fisica: false,
  atividade_fisica_detalhes: null,
  refeicoes_por_dia: null,
  come_fora_casa: null,
  prepara_propria_refeicao: false,
  quem_prepara_refeicoes: null,
  come_assistindo_tv: false,
  velocidade_refeicao: null,
  mastigacao: null,
  consumo_agua_litros: null,
  tipo_agua: null,
  usa_suplementos: false,
  suplementos_detalhes: null,
  restricoes_alimentares: [],
  restricoes_detalhes: null,
  intolerancias: [],
  alergias_alimentares: [],
  alergias_detalhes: null,
  objetivos_paciente: '',
  peso_desejado_kg: null,
  prazo_objetivo: null,
  observacoes: null,
};

export function AnamneseNutricionalBlock({
  currentAnamnese,
  anamneseHistory,
  loading,
  saving,
  canEdit,
  onSave,
  professionalId,
}: AnamneseNutricionalBlockProps) {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState<AnamneseNutricionalFormData>(initialFormData);
  const [expandedSections, setExpandedSections] = useState({
    queixa: true,
    historico: true,
    rotina: false,
    habitos: false,
    agua: false,
    suplementos: false,
    restricoes: false,
    objetivos: true,
  });

  // Preencher formulário com dados existentes para atualização
  const handleEdit = () => {
    if (currentAnamnese) {
      setFormData({
        queixa_principal: currentAnamnese.queixa_principal,
        historico_alimentar: currentAnamnese.historico_alimentar,
        dietas_anteriores: currentAnamnese.dietas_anteriores,
        rotina_diaria: currentAnamnese.rotina_diaria,
        horario_acordar: currentAnamnese.horario_acordar,
        horario_dormir: currentAnamnese.horario_dormir,
        horario_trabalho: currentAnamnese.horario_trabalho,
        pratica_atividade_fisica: currentAnamnese.pratica_atividade_fisica,
        atividade_fisica_detalhes: currentAnamnese.atividade_fisica_detalhes,
        refeicoes_por_dia: currentAnamnese.refeicoes_por_dia,
        come_fora_casa: currentAnamnese.come_fora_casa,
        prepara_propria_refeicao: currentAnamnese.prepara_propria_refeicao,
        quem_prepara_refeicoes: currentAnamnese.quem_prepara_refeicoes,
        come_assistindo_tv: currentAnamnese.come_assistindo_tv,
        velocidade_refeicao: currentAnamnese.velocidade_refeicao,
        mastigacao: currentAnamnese.mastigacao,
        consumo_agua_litros: currentAnamnese.consumo_agua_litros,
        tipo_agua: currentAnamnese.tipo_agua,
        usa_suplementos: currentAnamnese.usa_suplementos,
        suplementos_detalhes: currentAnamnese.suplementos_detalhes,
        restricoes_alimentares: currentAnamnese.restricoes_alimentares,
        restricoes_detalhes: currentAnamnese.restricoes_detalhes,
        intolerancias: currentAnamnese.intolerancias,
        alergias_alimentares: currentAnamnese.alergias_alimentares,
        alergias_detalhes: currentAnamnese.alergias_detalhes,
        objetivos_paciente: currentAnamnese.objetivos_paciente,
        peso_desejado_kg: currentAnamnese.peso_desejado_kg,
        prazo_objetivo: currentAnamnese.prazo_objetivo,
        observacoes: currentAnamnese.observacoes,
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId) {
      return;
    }
    const result = await onSave(formData, professionalId);
    if (result) {
      setFormData(initialFormData);
      setShowForm(false);
    }
  };

  const updateField = <K extends keyof AnamneseNutricionalFormData>(field: K, value: AnamneseNutricionalFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleArrayItem = (field: 'restricoes_alimentares' | 'intolerancias' | 'alergias_alimentares', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
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
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Anamnese Nutricional</h2>
          {currentAnamnese && (
            <Badge variant="outline" className="ml-2">
              v{currentAnamnese.version}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {anamneseHistory.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico ({anamneseHistory.length})
            </Button>
          )}
          {canEdit && !showForm && (
            <Button onClick={currentAnamnese ? handleEdit : () => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {currentAnamnese ? 'Atualizar' : 'Registrar'}
            </Button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {showForm && canEdit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              {currentAnamnese ? 'Atualizar Anamnese (Nova Versão)' : 'Nova Anamnese Nutricional'}
            </CardTitle>
            {currentAnamnese && (
              <p className="text-xs text-muted-foreground">
                Uma nova versão será criada. O histórico anterior será preservado.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Queixa Principal e Objetivos */}
              <Collapsible open={expandedSections.queixa} onOpenChange={() => toggleSection('queixa')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Target className="h-4 w-4 text-primary" />
                      Queixa Principal e Objetivos
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.queixa ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div>
                    <Label htmlFor="queixa_principal">Queixa Principal *</Label>
                    <Textarea
                      id="queixa_principal"
                      placeholder="Descreva o motivo principal da consulta..."
                      value={formData.queixa_principal}
                      onChange={(e) => updateField('queixa_principal', e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="objetivos_paciente">Objetivos do Paciente *</Label>
                    <Textarea
                      id="objetivos_paciente"
                      placeholder="O que o paciente deseja alcançar..."
                      value={formData.objetivos_paciente}
                      onChange={(e) => updateField('objetivos_paciente', e.target.value)}
                      rows={2}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="peso_desejado_kg">Peso Desejado (kg)</Label>
                      <Input
                        id="peso_desejado_kg"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 65"
                        value={formData.peso_desejado_kg ?? ''}
                        onChange={(e) => updateField('peso_desejado_kg', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="prazo_objetivo">Prazo para Objetivo</Label>
                      <Input
                        id="prazo_objetivo"
                        type="date"
                        value={formData.prazo_objetivo ?? ''}
                        onChange={(e) => updateField('prazo_objetivo', e.target.value || null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Histórico Alimentar */}
              <Collapsible open={expandedSections.historico} onOpenChange={() => toggleSection('historico')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Utensils className="h-4 w-4 text-accent-foreground" />
                      Histórico Alimentar
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.historico ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div>
                    <Label htmlFor="historico_alimentar">Histórico Alimentar</Label>
                    <Textarea
                      id="historico_alimentar"
                      placeholder="Descreva o histórico alimentar do paciente..."
                      value={formData.historico_alimentar}
                      onChange={(e) => updateField('historico_alimentar', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dietas_anteriores">Dietas Anteriores</Label>
                    <Textarea
                      id="dietas_anteriores"
                      placeholder="Quais dietas o paciente já fez? Como foi a experiência?"
                      value={formData.dietas_anteriores}
                      onChange={(e) => updateField('dietas_anteriores', e.target.value)}
                      rows={2}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Rotina Diária */}
              <Collapsible open={expandedSections.rotina} onOpenChange={() => toggleSection('rotina')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Rotina Diária
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.rotina ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div>
                    <Label htmlFor="rotina_diaria">Descrição da Rotina</Label>
                    <Textarea
                      id="rotina_diaria"
                      placeholder="Descreva a rotina diária do paciente..."
                      value={formData.rotina_diaria}
                      onChange={(e) => updateField('rotina_diaria', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="horario_acordar">Horário de Acordar</Label>
                      <Input
                        id="horario_acordar"
                        type="time"
                        value={formData.horario_acordar ?? ''}
                        onChange={(e) => updateField('horario_acordar', e.target.value || null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="horario_dormir">Horário de Dormir</Label>
                      <Input
                        id="horario_dormir"
                        type="time"
                        value={formData.horario_dormir ?? ''}
                        onChange={(e) => updateField('horario_dormir', e.target.value || null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="horario_trabalho">Horário de Trabalho</Label>
                      <Input
                        id="horario_trabalho"
                        placeholder="Ex: 8h às 18h"
                        value={formData.horario_trabalho ?? ''}
                        onChange={(e) => updateField('horario_trabalho', e.target.value || null)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pratica_atividade_fisica" className="cursor-pointer">
                        Pratica atividade física?
                      </Label>
                    </div>
                    <Switch
                      id="pratica_atividade_fisica"
                      checked={formData.pratica_atividade_fisica}
                      onCheckedChange={(checked) => updateField('pratica_atividade_fisica', checked)}
                    />
                  </div>
                  {formData.pratica_atividade_fisica && (
                    <div>
                      <Label htmlFor="atividade_fisica_detalhes">Detalhes da Atividade Física</Label>
                      <Textarea
                        id="atividade_fisica_detalhes"
                        placeholder="Qual atividade, frequência, duração..."
                        value={formData.atividade_fisica_detalhes ?? ''}
                        onChange={(e) => updateField('atividade_fisica_detalhes', e.target.value || null)}
                        rows={2}
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Hábitos Alimentares */}
              <Collapsible open={expandedSections.habitos} onOpenChange={() => toggleSection('habitos')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Utensils className="h-4 w-4 text-secondary-foreground" />
                      Hábitos Alimentares
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.habitos ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="refeicoes_por_dia">Refeições por Dia</Label>
                      <Input
                        id="refeicoes_por_dia"
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Ex: 5"
                        value={formData.refeicoes_por_dia ?? ''}
                        onChange={(e) => updateField('refeicoes_por_dia', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="come_fora_casa">Come fora de casa</Label>
                      <Select
                        value={formData.come_fora_casa ?? ''}
                        onValueChange={(value: FrequenciaConsumo) => updateField('come_fora_casa', value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FREQUENCIA_CONSUMO_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="velocidade_refeicao">Velocidade da Refeição</Label>
                      <Select
                        value={formData.velocidade_refeicao ?? ''}
                        onValueChange={(value: 'lenta' | 'normal' | 'rapida') => updateField('velocidade_refeicao', value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lenta">Lenta</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="rapida">Rápida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mastigacao">Mastigação</Label>
                      <Select
                        value={formData.mastigacao ?? ''}
                        onValueChange={(value: 'adequada' | 'rapida' | 'muito_rapida') => updateField('mastigacao', value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adequada">Adequada</SelectItem>
                          <SelectItem value="rapida">Rápida</SelectItem>
                          <SelectItem value="muito_rapida">Muito Rápida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <Label htmlFor="prepara_propria_refeicao" className="cursor-pointer">
                        Prepara própria refeição?
                      </Label>
                      <Switch
                        id="prepara_propria_refeicao"
                        checked={formData.prepara_propria_refeicao}
                        onCheckedChange={(checked) => updateField('prepara_propria_refeicao', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <Label htmlFor="come_assistindo_tv" className="cursor-pointer">
                        Come assistindo TV?
                      </Label>
                      <Switch
                        id="come_assistindo_tv"
                        checked={formData.come_assistindo_tv}
                        onCheckedChange={(checked) => updateField('come_assistindo_tv', checked)}
                      />
                    </div>
                  </div>
                  {!formData.prepara_propria_refeicao && (
                    <div>
                      <Label htmlFor="quem_prepara_refeicoes">Quem prepara as refeições?</Label>
                      <Input
                        id="quem_prepara_refeicoes"
                        placeholder="Ex: Esposa, mãe, restaurante..."
                        value={formData.quem_prepara_refeicoes ?? ''}
                        onChange={(e) => updateField('quem_prepara_refeicoes', e.target.value || null)}
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Consumo de Água */}
              <Collapsible open={expandedSections.agua} onOpenChange={() => toggleSection('agua')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Droplets className="h-4 w-4 text-primary" />
                      Consumo de Água
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.agua ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consumo_agua_litros">Consumo Diário (litros)</Label>
                      <Input
                        id="consumo_agua_litros"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="Ex: 2"
                        value={formData.consumo_agua_litros ?? ''}
                        onChange={(e) => updateField('consumo_agua_litros', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo_agua">Tipo de Água</Label>
                      <Select
                        value={formData.tipo_agua ?? ''}
                        onValueChange={(value: 'filtrada' | 'mineral' | 'torneira' | 'outro') => updateField('tipo_agua', value || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="filtrada">Filtrada</SelectItem>
                          <SelectItem value="mineral">Mineral</SelectItem>
                          <SelectItem value="torneira">Torneira</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Suplementos */}
              <Collapsible open={expandedSections.suplementos} onOpenChange={() => toggleSection('suplementos')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Pill className="h-4 w-4 text-secondary-foreground" />
                      Uso de Suplementos
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.suplementos ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label htmlFor="usa_suplementos" className="cursor-pointer">
                      Faz uso de suplementos?
                    </Label>
                    <Switch
                      id="usa_suplementos"
                      checked={formData.usa_suplementos}
                      onCheckedChange={(checked) => updateField('usa_suplementos', checked)}
                    />
                  </div>
                  {formData.usa_suplementos && (
                    <div>
                      <Label htmlFor="suplementos_detalhes">Quais suplementos?</Label>
                      <Textarea
                        id="suplementos_detalhes"
                        placeholder="Liste os suplementos utilizados, dosagem e frequência..."
                        value={formData.suplementos_detalhes ?? ''}
                        onChange={(e) => updateField('suplementos_detalhes', e.target.value || null)}
                        rows={2}
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Restrições, Intolerâncias e Alergias */}
              <Collapsible open={expandedSections.restricoes} onOpenChange={() => toggleSection('restricoes')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Restrições, Intolerâncias e Alergias
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.restricoes ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  {/* Restrições Alimentares */}
                  <div>
                    <Label className="mb-2">Restrições Alimentares</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {RESTRICOES_ALIMENTARES_OPTIONS.map((restricao) => (
                        <div key={restricao} className="flex items-center space-x-2">
                          <Checkbox
                            id={`restricao-${restricao}`}
                            checked={formData.restricoes_alimentares.includes(restricao)}
                            onCheckedChange={() => toggleArrayItem('restricoes_alimentares', restricao)}
                          />
                          <label htmlFor={`restricao-${restricao}`} className="text-sm cursor-pointer">
                            {restricao}
                          </label>
                        </div>
                      ))}
                    </div>
                    <Textarea
                      className="mt-2"
                      placeholder="Outras restrições ou detalhes..."
                      value={formData.restricoes_detalhes ?? ''}
                      onChange={(e) => updateField('restricoes_detalhes', e.target.value || null)}
                      rows={2}
                    />
                  </div>

                  {/* Intolerâncias */}
                  <div>
                    <Label className="mb-2">Intolerâncias</Label>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      {INTOLERANCIAS_OPTIONS.map((intolerancia) => (
                        <div key={intolerancia} className="flex items-center space-x-2">
                          <Checkbox
                            id={`intolerancia-${intolerancia}`}
                            checked={formData.intolerancias.includes(intolerancia)}
                            onCheckedChange={() => toggleArrayItem('intolerancias', intolerancia)}
                          />
                          <label htmlFor={`intolerancia-${intolerancia}`} className="text-sm cursor-pointer">
                            {intolerancia}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alergias */}
                  <div>
                    <Label className="mb-2">Alergias Alimentares</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {ALERGIAS_ALIMENTARES_OPTIONS.map((alergia) => (
                        <div key={alergia} className="flex items-center space-x-2">
                          <Checkbox
                            id={`alergia-${alergia}`}
                            checked={formData.alergias_alimentares.includes(alergia)}
                            onCheckedChange={() => toggleArrayItem('alergias_alimentares', alergia)}
                          />
                          <label htmlFor={`alergia-${alergia}`} className="text-sm cursor-pointer">
                            {alergia}
                          </label>
                        </div>
                      ))}
                    </div>
                    <Textarea
                      className="mt-2"
                      placeholder="Outras alergias ou detalhes sobre reações..."
                      value={formData.alergias_detalhes ?? ''}
                      onChange={(e) => updateField('alergias_detalhes', e.target.value || null)}
                      rows={2}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Outras observações relevantes..."
                  value={formData.observacoes ?? ''}
                  onChange={(e) => updateField('observacoes', e.target.value || null)}
                  rows={2}
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setFormData(initialFormData);
                    setShowForm(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !formData.queixa_principal || !formData.objetivos_paciente}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Anamnese'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Anamnese Atual (Visualização) */}
      {currentAnamnese && !showForm && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Anamnese Atual</CardTitle>
                <Badge variant="outline">v{currentAnamnese.version}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(currentAnamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
            {currentAnamnese.created_by_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Registrada por {currentAnamnese.created_by_name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Queixa e Objetivos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Queixa Principal</p>
                <p className="text-sm">{currentAnamnese.queixa_principal}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Objetivos</p>
                <p className="text-sm">{currentAnamnese.objetivos_paciente}</p>
                {currentAnamnese.peso_desejado_kg && (
                  <Badge variant="outline" className="mt-1">Meta: {currentAnamnese.peso_desejado_kg} kg</Badge>
                )}
              </div>
            </div>

            {/* Histórico Alimentar */}
            {currentAnamnese.historico_alimentar && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Histórico Alimentar</p>
                <p className="text-sm bg-muted/50 p-2 rounded">{currentAnamnese.historico_alimentar}</p>
              </div>
            )}

            {/* Dados da Rotina */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {currentAnamnese.refeicoes_por_dia && (
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Refeições/dia</p>
                  <p className="font-medium">{currentAnamnese.refeicoes_por_dia}</p>
                </div>
              )}
              {currentAnamnese.consumo_agua_litros && (
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Água/dia</p>
                  <p className="font-medium">{currentAnamnese.consumo_agua_litros}L</p>
                </div>
              )}
              {currentAnamnese.horario_acordar && (
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Acorda</p>
                  <p className="font-medium">{currentAnamnese.horario_acordar}</p>
                </div>
              )}
              {currentAnamnese.horario_dormir && (
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Dorme</p>
                  <p className="font-medium">{currentAnamnese.horario_dormir}</p>
                </div>
              )}
            </div>

            {/* Restrições e Alergias */}
            <div className="flex flex-wrap gap-2">
              {currentAnamnese.restricoes_alimentares.map((restricao) => (
                <Badge key={restricao} variant="secondary">{restricao}</Badge>
              ))}
              {currentAnamnese.intolerancias.map((intolerancia) => (
                <Badge key={intolerancia} variant="outline" className="text-accent-foreground border-accent">{intolerancia}</Badge>
              ))}
              {currentAnamnese.alergias_alimentares.map((alergia) => (
                <Badge key={alergia} variant="destructive">{alergia}</Badge>
              ))}
            </div>

            {/* Suplementos */}
            {currentAnamnese.usa_suplementos && currentAnamnese.suplementos_detalhes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Suplementos em Uso</p>
                <p className="text-sm bg-secondary/50 p-2 rounded">{currentAnamnese.suplementos_detalhes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {showHistory && anamneseHistory.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Versões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {anamneseHistory.map((anamnese) => (
                  <div 
                    key={anamnese.id}
                    className={`p-3 rounded-lg border ${anamnese.is_current ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={anamnese.is_current ? 'default' : 'outline'}>
                          v{anamnese.version}
                        </Badge>
                        {anamnese.is_current && (
                          <Badge variant="secondary" className="text-xs">Atual</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(anamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {anamnese.queixa_principal}
                    </p>
                    {anamnese.created_by_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Por: {anamnese.created_by_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!currentAnamnese && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma anamnese nutricional registrada.</p>
            {canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Anamnese
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
