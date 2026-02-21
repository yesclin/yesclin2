import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain,
  Edit3,
  Save,
  X,
  Clock,
  History,
  MessageCircle,
  Heart,
  Users,
  Briefcase,
  ClipboardList,
  Target,
  ShieldAlert,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Settings,
  Pill,
  Bed,
  Moon,
  Apple,
  Route,
  Eye,
  EyeOff,
  Monitor,
  Video,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import type { 
  AnamnesePsicologiaData, 
  AnamnesePsicologiaFormData 
} from "@/hooks/prontuario/psicologia/useAnamnesePsicologiaData";
import { useResolvedAnamnesisTemplate } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";
import { AnamneseModelSelector } from "@/components/prontuario/AnamneseModelSelector";

interface AnamnesePsicologiaBlockProps {
  currentAnamnese: AnamnesePsicologiaData | null;
  anamneseHistory: AnamnesePsicologiaData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: AnamnesePsicologiaFormData) => Promise<void>;
  onUpdate?: (id: string, data: AnamnesePsicologiaFormData) => Promise<void>;
  specialtyId?: string | null;
  procedureId?: string | null;
}

const EMPTY_FORM: AnamnesePsicologiaFormData = {
  queixa_principal: '',
  historico_emocional_comportamental: '',
  ja_fez_terapia: false,
  ja_fez_terapia_obs: '',
  uso_medicacao: false,
  uso_medicacao_qual: '',
  diagnostico_previo: '',
  internacoes: false,
  internacoes_obs: '',
  contexto_familiar: '',
  contexto_trabalho: '',
  contexto_relacionamentos: '',
  contexto_vida_social: '',
  contexto_rotina: '',
  contexto_sono: '',
  contexto_alimentacao: '',
  contexto_social: '',
  historico_tratamentos: '',
  expectativas_terapia: '',
  fatores_risco: '',
  fatores_protecao: '',
  impressoes_clinicas: '',
  formulacao_inicial: '',
  hipoteses: '',
  ocultar_avaliacao_relatorio: false,
  objetivo_1: '',
  objetivo_2: '',
  objetivo_3: '',
  modalidade: 'presencial',
  observacoes: '',
};

/**
 * AVALIAÇÃO INICIAL — Bloco exclusivo para Psicologia (Primeiro Atendimento)
 * 
 * Estrutura profissional completa:
 * - Queixa Principal
 * - História do Problema Atual
 * - Histórico Psicológico/Psiquiátrico
 * - Histórico Familiar
 * - Contexto Atual (trabalho, relacionamentos, vida social, rotina, sono, alimentação)
 * - Avaliação Técnica do Profissional (impressões, formulação, hipóteses)
 * - Objetivos Terapêuticos
 */
export function AnamnesePsicologiaBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  onUpdate,
  specialtyId,
  procedureId,
}: AnamnesePsicologiaBlockProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamnesePsicologiaData | null>(null);
  const [formData, setFormData] = useState<AnamnesePsicologiaFormData>(EMPTY_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const {
    data: resolvedTemplate,
    allTemplates,
    hasMultipleTemplates,
    isLoading: templateLoading,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

  const hasTemplate = !!resolvedTemplate;

  const handleStartEdit = () => {
    if (currentAnamnese) {
      setFormData({ ...currentAnamnese });
      setIsEditingExisting(true);
    }
    setIsEditing(true);
  };

  const handleStartNewVersion = () => {
    if (currentAnamnese) {
      setFormData({ ...currentAnamnese });
    }
    setIsEditingExisting(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingExisting(false);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (isEditingExisting && currentAnamnese && onUpdate) {
      await onUpdate(currentAnamnese.id, formData);
    } else {
      await onSave(formData);
    }
    setIsEditing(false);
    setIsEditingExisting(false);
  };

  const updateField = (field: keyof AnamnesePsicologiaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state
  if (!currentAnamnese && !isEditing) {
    return (
      <AnamneseModelSelector
        icon={<Brain className="h-10 w-10 text-muted-foreground opacity-50" />}
        emptyTitle="Nenhuma avaliação inicial registrada"
        emptyDescription="Registre a avaliação inicial para iniciar o acompanhamento terapêutico."
        registerLabel="Registrar Avaliação Inicial"
        resolvedTemplate={resolvedTemplate}
        allTemplates={allTemplates}
        isLoading={templateLoading}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={setSelectedTemplateId}
        canEdit={canEdit}
        canManageTemplates={canEdit}
        onRegister={() => setIsEditing(true)}
        onOpenTemplateEditor={() => navigate(`/app/config/prontuario?especialidade_id=${specialtyId}&tipo=anamnese`)}
        onConfigureTemplate={() => navigate('/configuracoes/modelos-anamnese')}
        specialtyLabel="Psicologia"
      />
    );
  }

  // Editing mode — single-page form
  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {isEditingExisting ? 'Editar Avaliação Inicial' : currentAnamnese ? 'Nova Versão da Avaliação' : 'Nova Avaliação Inicial — Psicologia'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {isEditingExisting ? (
            <p className="text-sm text-muted-foreground">
              Editando a versão atual. As alterações serão salvas diretamente.
            </p>
          ) : currentAnamnese ? (
            <p className="text-sm text-muted-foreground">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px] pr-4">
            <div className="space-y-6">
              {/* Modalidade */}
              <div className="flex items-center gap-4">
                <Label className="flex items-center gap-2">
                  {formData.modalidade === 'online' ? <Video className="h-4 w-4 text-blue-500" /> : <Monitor className="h-4 w-4 text-primary" />}
                  Modalidade
                </Label>
                <Select value={formData.modalidade} onValueChange={(v) => updateField('modalidade', v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* BLOCO 1: Queixa Principal */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Queixa Principal
                </Label>
                <Textarea
                  placeholder="O que trouxe o paciente à terapia? Qual é a principal dificuldade relatada?"
                  value={formData.queixa_principal}
                  onChange={(e) => updateField('queixa_principal', e.target.value)}
                  rows={4}
                />
              </div>

              <Separator />

              {/* BLOCO 2: História do Problema Atual */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Heart className="h-4 w-4 text-pink-500" />
                  História do Problema Atual
                </Label>
                <Textarea
                  placeholder="Quando os sintomas começaram? Como evoluíram? Quais padrões emocionais e comportamentais são observados?"
                  value={formData.historico_emocional_comportamental}
                  onChange={(e) => updateField('historico_emocional_comportamental', e.target.value)}
                  rows={5}
                />
              </div>

              <Separator />

              {/* BLOCO 3: Histórico Psicológico/Psiquiátrico */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  Histórico Psicológico / Psiquiátrico
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  {/* Já fez terapia? */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch checked={formData.ja_fez_terapia} onCheckedChange={(v) => updateField('ja_fez_terapia', v)} />
                      <Label className="text-sm">Já fez terapia anteriormente?</Label>
                    </div>
                    {formData.ja_fez_terapia && (
                      <Textarea
                        placeholder="Detalhes: duração, abordagem, motivo de encerramento..."
                        value={formData.ja_fez_terapia_obs}
                        onChange={(e) => updateField('ja_fez_terapia_obs', e.target.value)}
                        rows={2}
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Uso de medicação? */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch checked={formData.uso_medicacao} onCheckedChange={(v) => updateField('uso_medicacao', v)} />
                      <Label className="text-sm flex items-center gap-1">
                        <Pill className="h-3.5 w-3.5" /> Uso de medicação psiquiátrica?
                      </Label>
                    </div>
                    {formData.uso_medicacao && (
                      <Textarea
                        placeholder="Qual medicação? Dosagem? Há quanto tempo?"
                        value={formData.uso_medicacao_qual}
                        onChange={(e) => updateField('uso_medicacao_qual', e.target.value)}
                        rows={2}
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Diagnóstico prévio */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Diagnóstico prévio (opcional)</Label>
                    <Input
                      placeholder="Ex: Transtorno de Ansiedade Generalizada"
                      value={formData.diagnostico_previo}
                      onChange={(e) => updateField('diagnostico_previo', e.target.value)}
                    />
                  </div>

                  {/* Internações */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch checked={formData.internacoes} onCheckedChange={(v) => updateField('internacoes', v)} />
                      <Label className="text-sm flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" /> Internações?
                      </Label>
                    </div>
                    {formData.internacoes && (
                      <Textarea
                        placeholder="Detalhes das internações..."
                        value={formData.internacoes_obs}
                        onChange={(e) => updateField('internacoes_obs', e.target.value)}
                        rows={2}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* BLOCO 4: Histórico Familiar */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-4 w-4 text-purple-500" />
                  Histórico Familiar
                </Label>
                <Textarea
                  placeholder="Dinâmica familiar, relacionamentos, histórico familiar de saúde mental..."
                  value={formData.contexto_familiar}
                  onChange={(e) => updateField('contexto_familiar', e.target.value)}
                  rows={4}
                />
              </div>

              <Separator />

              {/* BLOCO 5: Contexto Atual */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Contexto Atual
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Trabalho</Label>
                    <Textarea
                      placeholder="Situação profissional, satisfação, estresse..."
                      value={formData.contexto_trabalho}
                      onChange={(e) => updateField('contexto_trabalho', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Relacionamentos</Label>
                    <Textarea
                      placeholder="Relacionamento afetivo, conflitos..."
                      value={formData.contexto_relacionamentos}
                      onChange={(e) => updateField('contexto_relacionamentos', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Vida Social</Label>
                    <Textarea
                      placeholder="Amizades, atividades sociais, rede de apoio..."
                      value={formData.contexto_vida_social}
                      onChange={(e) => updateField('contexto_vida_social', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Rotina</Label>
                    <Textarea
                      placeholder="Rotina diária, atividades, organização..."
                      value={formData.contexto_rotina}
                      onChange={(e) => updateField('contexto_rotina', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Moon className="h-3.5 w-3.5" /> Sono
                    </Label>
                    <Textarea
                      placeholder="Qualidade do sono, insônia, pesadelos..."
                      value={formData.contexto_sono}
                      onChange={(e) => updateField('contexto_sono', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Apple className="h-3.5 w-3.5" /> Alimentação
                    </Label>
                    <Textarea
                      placeholder="Padrão alimentar, apetite, compulsões..."
                      value={formData.contexto_alimentacao}
                      onChange={(e) => updateField('contexto_alimentacao', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* BLOCO 6: Fatores de Risco e Proteção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Fatores de Risco
                  </Label>
                  <Textarea
                    placeholder="Ideação suicida, autolesão, abuso de substâncias..."
                    value={formData.fatores_risco}
                    onChange={(e) => updateField('fatores_risco', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    Fatores de Proteção
                  </Label>
                  <Textarea
                    placeholder="Rede de apoio, habilidades, recursos pessoais..."
                    value={formData.fatores_protecao}
                    onChange={(e) => updateField('fatores_protecao', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* BLOCO 7: Avaliação Técnica do Profissional */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Brain className="h-4 w-4 text-purple-600" />
                    Avaliação Técnica do Profissional
                  </Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch 
                      checked={formData.ocultar_avaliacao_relatorio} 
                      onCheckedChange={(v) => updateField('ocultar_avaliacao_relatorio', v)} 
                    />
                    <span className="flex items-center gap-1">
                      {formData.ocultar_avaliacao_relatorio ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      Ocultar no relatório
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Impressões Clínicas</Label>
                    <Textarea
                      placeholder="Impressões iniciais sobre o paciente, comportamento observado, discurso..."
                      value={formData.impressoes_clinicas}
                      onChange={(e) => updateField('impressoes_clinicas', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Formulação Inicial</Label>
                    <Textarea
                      placeholder="Formulação de caso, compreensão dinâmica..."
                      value={formData.formulacao_inicial}
                      onChange={(e) => updateField('formulacao_inicial', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Hipóteses (não obrigatório)</Label>
                    <Textarea
                      placeholder="Hipóteses diagnósticas iniciais..."
                      value={formData.hipoteses}
                      onChange={(e) => updateField('hipoteses', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* BLOCO 8: Objetivos Terapêuticos */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Target className="h-4 w-4 text-green-600" />
                  Objetivos Terapêuticos
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">1</Badge>
                    <Input
                      placeholder="Objetivo terapêutico 1"
                      value={formData.objetivo_1}
                      onChange={(e) => updateField('objetivo_1', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">2</Badge>
                    <Input
                      placeholder="Objetivo terapêutico 2"
                      value={formData.objetivo_2}
                      onChange={(e) => updateField('objetivo_2', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">3</Badge>
                    <Input
                      placeholder="Objetivo terapêutico 3"
                      value={formData.objetivo_3}
                      onChange={(e) => updateField('objetivo_3', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Observações */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Observações Adicionais
                </Label>
                <Textarea
                  placeholder="Outras informações relevantes..."
                  value={formData.observacoes}
                  onChange={(e) => updateField('observacoes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // View mode
  const renderField = (label: string, value: string | undefined, icon?: React.ReactNode) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {icon}
          {label}
        </div>
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Avaliação Inicial — Psicologia</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentAnamnese?.version || 1}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {currentAnamnese?.modalidade === 'online' ? '🟢 Online' : '🏥 Presencial'}
          </Badge>
        </div>
        <div className="flex gap-2">
          {anamneseHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" /> Histórico ({anamneseHistory.length})
            </Button>
          )}
          {canEdit && onUpdate && (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-1" /> Editar
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartNewVersion}>
              <Save className="h-4 w-4 mr-1" /> Nova Versão
            </Button>
          )}
        </div>
      </div>

      {/* Last update */}
      {currentAnamnese && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Registrada em{' '}
            {format(parseISO(currentAnamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentAnamnese.created_by_name && ` por ${currentAnamnese.created_by_name}`}
          </span>
        </div>
      )}

      {/* Content as accordion */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={['queixa', 'hda', 'historico_psiq', 'contexto_atual', 'avaliacao_tecnica', 'objetivos']} className="w-full">
            <AccordionItem value="queixa" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>Queixa Principal</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.queixa_principal || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="hda" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span>História do Problema Atual</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.historico_emocional_comportamental || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="historico_psiq" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  <span>Histórico Psicológico / Psiquiátrico</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/40 p-3 rounded-lg">
                    <span className="font-medium">Terapia anterior:</span>{' '}
                    {currentAnamnese?.ja_fez_terapia ? `Sim — ${currentAnamnese.ja_fez_terapia_obs || 'sem detalhes'}` : 'Não'}
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg">
                    <span className="font-medium">Medicação:</span>{' '}
                    {currentAnamnese?.uso_medicacao ? `Sim — ${currentAnamnese.uso_medicacao_qual || 'sem detalhes'}` : 'Não'}
                  </div>
                  {currentAnamnese?.diagnostico_previo && (
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <span className="font-medium">Diagnóstico prévio:</span> {currentAnamnese.diagnostico_previo}
                    </div>
                  )}
                  <div className="bg-muted/40 p-3 rounded-lg">
                    <span className="font-medium">Internações:</span>{' '}
                    {currentAnamnese?.internacoes ? `Sim — ${currentAnamnese.internacoes_obs || 'sem detalhes'}` : 'Não'}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="familiar" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Histórico Familiar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.contexto_familiar || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contexto_atual" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <span>Contexto Atual</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Trabalho', currentAnamnese?.contexto_trabalho)}
                  {renderField('Relacionamentos', currentAnamnese?.contexto_relacionamentos)}
                  {renderField('Vida Social', currentAnamnese?.contexto_vida_social)}
                  {renderField('Rotina', currentAnamnese?.contexto_rotina)}
                  {renderField('Sono', currentAnamnese?.contexto_sono)}
                  {renderField('Alimentação', currentAnamnese?.contexto_alimentacao)}
                </div>
                {!currentAnamnese?.contexto_trabalho && !currentAnamnese?.contexto_relacionamentos && 
                 !currentAnamnese?.contexto_vida_social && !currentAnamnese?.contexto_rotina && (
                  <p className="text-sm italic text-muted-foreground">Não informado</p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="riscos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <span>Fatores de Risco e Proteção</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Fatores de Risco', currentAnamnese?.fatores_risco, <ShieldAlert className="h-3 w-3 text-red-500" />)}
                  {renderField('Fatores de Proteção', currentAnamnese?.fatores_protecao, <ShieldCheck className="h-3 w-3 text-green-500" />)}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="avaliacao_tecnica" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span>Avaliação Técnica do Profissional</span>
                  {currentAnamnese?.ocultar_avaliacao_relatorio && (
                    <Badge variant="outline" className="text-[10px] ml-1"><EyeOff className="h-3 w-3 mr-1" />Oculto no relatório</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                {renderField('Impressões Clínicas', currentAnamnese?.impressoes_clinicas)}
                {renderField('Formulação Inicial', currentAnamnese?.formulacao_inicial)}
                {renderField('Hipóteses', currentAnamnese?.hipoteses)}
                {!currentAnamnese?.impressoes_clinicas && !currentAnamnese?.formulacao_inicial && (
                  <p className="text-sm italic text-muted-foreground">Não informado</p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="objetivos">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span>Objetivos Terapêuticos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {[currentAnamnese?.objetivo_1, currentAnamnese?.objetivo_2, currentAnamnese?.objetivo_3]
                    .filter(Boolean)
                    .map((obj, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{i + 1}</Badge>
                        <p className="text-sm">{obj}</p>
                      </div>
                    ))}
                  {!currentAnamnese?.objetivo_1 && !currentAnamnese?.objetivo_2 && !currentAnamnese?.objetivo_3 && (
                    <p className="text-sm italic text-muted-foreground">Nenhum objetivo definido</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {anamneseHistory.map(version => (
                <button
                  key={version.id}
                  onClick={() => { setSelectedVersion(version); setShowHistory(false); }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={version.is_current ? "default" : "outline"}>
                      Versão {version.version} {version.is_current && '(atual)'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(version.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {version.created_by_name && (
                    <p className="text-xs text-muted-foreground mt-1">por {version.created_by_name}</p>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version View Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Versão {selectedVersion?.version}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {renderField('Queixa Principal', selectedVersion?.queixa_principal)}
              {renderField('História do Problema Atual', selectedVersion?.historico_emocional_comportamental)}
              {renderField('Histórico Familiar', selectedVersion?.contexto_familiar)}
              {renderField('Impressões Clínicas', selectedVersion?.impressoes_clinicas)}
              {renderField('Formulação Inicial', selectedVersion?.formulacao_inicial)}
              {renderField('Observações', selectedVersion?.observacoes)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
