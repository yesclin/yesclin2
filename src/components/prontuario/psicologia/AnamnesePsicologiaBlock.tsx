import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronRight,
  AlertTriangle,
  Settings
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import type { 
  AnamnesePsicologiaData, 
  AnamnesePsicologiaFormData 
} from "@/hooks/prontuario/psicologia/useAnamnesePsicologiaData";
import { useResolvedAnamnesisTemplate } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";
import { AnamnesisTemplatePicker } from "@/components/prontuario/AnamnesisTemplatePicker";

interface AnamnesePsicologiaBlockProps {
  currentAnamnese: AnamnesePsicologiaData | null;
  anamneseHistory: AnamnesePsicologiaData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: AnamnesePsicologiaFormData) => Promise<void>;
  specialtyId?: string | null;
  procedureId?: string | null;
}

const EMPTY_FORM: AnamnesePsicologiaFormData = {
  queixa_principal: '',
  historico_emocional_comportamental: '',
  contexto_familiar: '',
  contexto_social: '',
  historico_tratamentos: '',
  expectativas_terapia: '',
  fatores_risco: '',
  fatores_protecao: '',
  observacoes: '',
};

/**
 * ANAMNESE PSICOLÓGICA - Bloco exclusivo para Psicologia
 * 
 * Contém:
 * - Queixa principal (relato do paciente)
 * - Histórico emocional e comportamental
 * - Contexto familiar
 * - Contexto social
 * - Histórico de tratamentos anteriores
 * - Expectativas em relação à terapia
 * - Fatores de risco e proteção
 * 
 * Regras:
 * - Não sobrescreve automaticamente
 * - Permite atualizações manuais (cria nova versão)
 * - Mantém histórico/versionamento completo
 */
export function AnamnesePsicologiaBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  specialtyId,
  procedureId,
}: AnamnesePsicologiaBlockProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamnesePsicologiaData | null>(null);
  const [formData, setFormData] = useState<AnamnesePsicologiaFormData>(EMPTY_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Template resolution for specialty validation
  const {
    data: resolvedTemplate,
    allTemplates,
    hasMultipleTemplates,
    isLoading: templateLoading,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

  const hasTemplate = !!resolvedTemplate;

  const handleStartEdit = () => {
    if (currentAnamnese) {
      setFormData({
        queixa_principal: currentAnamnese.queixa_principal || '',
        historico_emocional_comportamental: currentAnamnese.historico_emocional_comportamental || '',
        contexto_familiar: currentAnamnese.contexto_familiar || '',
        contexto_social: currentAnamnese.contexto_social || '',
        historico_tratamentos: currentAnamnese.historico_tratamentos || '',
        expectativas_terapia: currentAnamnese.expectativas_terapia || '',
        fatores_risco: currentAnamnese.fatores_risco || '',
        fatores_protecao: currentAnamnese.fatores_protecao || '',
        observacoes: currentAnamnese.observacoes || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsEditing(false);
  };

  const handleViewVersion = (version: AnamnesePsicologiaData) => {
    setSelectedVersion(version);
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
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhuma anamnese psicológica registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre a anamnese inicial para iniciar o acompanhamento terapêutico.
          </p>

          {/* Template picker */}
          {specialtyId && (
            <div className="flex justify-center mb-4">
              <AnamnesisTemplatePicker
                resolvedTemplate={resolvedTemplate}
                allTemplates={allTemplates}
                hasMultipleTemplates={hasMultipleTemplates}
                isLoading={templateLoading}
                hasStartedFilling={false}
                onTemplateChange={setSelectedTemplateId}
                selectedTemplateId={selectedTemplateId}
                versionNumber={resolvedTemplate?.version_number}
              />
            </div>
          )}

          {/* No template warning */}
          {!templateLoading && !hasTemplate && specialtyId && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mb-3">
                <AlertTriangle className="h-4 w-4" />
                <span>Nenhum modelo de anamnese configurado para Psicologia</span>
              </div>
              <Button variant="outline" onClick={() => navigate('/configuracoes/modelos-anamnese')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Modelo
              </Button>
            </div>
          )}

          {canEdit && hasTemplate && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Registrar Anamnese
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {currentAnamnese ? 'Atualizar Anamnese Psicológica' : 'Nova Anamnese Psicológica'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {currentAnamnese && (
            <p className="text-sm text-muted-foreground">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {/* Queixa Principal */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Queixa Principal
                </Label>
                <p className="text-xs text-muted-foreground">
                  Relato do paciente sobre o motivo da busca por terapia
                </p>
                <Textarea
                  placeholder="O que trouxe o paciente à terapia? Qual é a principal dificuldade relatada?"
                  value={formData.queixa_principal}
                  onChange={(e) => setFormData(prev => ({ ...prev, queixa_principal: e.target.value }))}
                  rows={4}
                />
              </div>

              <Separator />

              {/* Histórico Emocional e Comportamental */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Histórico Emocional e Comportamental
                </Label>
                <p className="text-xs text-muted-foreground">
                  Padrões emocionais, comportamentos recorrentes, eventos significativos
                </p>
                <Textarea
                  placeholder="Como o paciente lida com emoções? Quais padrões comportamentais são observados?"
                  value={formData.historico_emocional_comportamental}
                  onChange={(e) => setFormData(prev => ({ ...prev, historico_emocional_comportamental: e.target.value }))}
                  rows={4}
                />
              </div>

              <Separator />

              {/* Contexto Familiar */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Contexto Familiar
                </Label>
                <p className="text-xs text-muted-foreground">
                  Dinâmica familiar, relacionamentos, histórico familiar de saúde mental
                </p>
                <Textarea
                  placeholder="Composição familiar, qualidade dos relacionamentos, eventos familiares relevantes..."
                  value={formData.contexto_familiar}
                  onChange={(e) => setFormData(prev => ({ ...prev, contexto_familiar: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Contexto Social */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Contexto Social
                </Label>
                <p className="text-xs text-muted-foreground">
                  Trabalho, estudos, vida social, rede de apoio
                </p>
                <Textarea
                  placeholder="Situação profissional, vida acadêmica, amizades, atividades sociais..."
                  value={formData.contexto_social}
                  onChange={(e) => setFormData(prev => ({ ...prev, contexto_social: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Histórico de Tratamentos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  Histórico de Tratamentos Anteriores
                </Label>
                <p className="text-xs text-muted-foreground">
                  Tratamentos psicológicos/psiquiátricos anteriores e seus resultados
                </p>
                <Textarea
                  placeholder="Terapias anteriores, internações, uso de medicação psiquiátrica..."
                  value={formData.historico_tratamentos}
                  onChange={(e) => setFormData(prev => ({ ...prev, historico_tratamentos: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Expectativas em Relação à Terapia */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Expectativas em Relação à Terapia
                </Label>
                <p className="text-xs text-muted-foreground">
                  O que o paciente espera alcançar com o tratamento
                </p>
                <Textarea
                  placeholder="Objetivos do paciente, expectativas, mudanças desejadas..."
                  value={formData.expectativas_terapia}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectativas_terapia: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Fatores de Risco */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  Fatores de Risco
                </Label>
                <p className="text-xs text-muted-foreground">
                  Vulnerabilidades, riscos identificados, sinais de alerta
                </p>
                <Textarea
                  placeholder="Ideação suicida, autolesão, abuso de substâncias, situações de risco..."
                  value={formData.fatores_risco}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatores_risco: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Fatores de Proteção */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Fatores de Proteção
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recursos do paciente, forças, rede de apoio
                </p>
                <Textarea
                  placeholder="Rede de apoio, habilidades de enfrentamento, recursos pessoais..."
                  value={formData.fatores_protecao}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatores_protecao: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Observações */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Observações Adicionais
                </Label>
                <Textarea
                  placeholder="Outras informações relevantes, impressões iniciais..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
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
  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Anamnese Psicológica</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentAnamnese?.version || 1}
          </Badge>
        </div>
        <div className="flex gap-2">
          {anamneseHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({anamneseHistory.length})
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
      </div>

      {/* Last update info */}
      {currentAnamnese && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Última atualização em{' '}
            {format(parseISO(currentAnamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentAnamnese.created_by_name && ` por ${currentAnamnese.created_by_name}`}
          </span>
        </div>
      )}

      {/* Anamnese Content */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={['queixa', 'historico_emocional']} className="w-full">
            {/* Queixa Principal */}
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

            {/* Histórico Emocional e Comportamental */}
            <AccordionItem value="historico_emocional" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span>Histórico Emocional e Comportamental</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.historico_emocional_comportamental || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Contexto Familiar */}
            <AccordionItem value="contexto_familiar" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Contexto Familiar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.contexto_familiar || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Contexto Social */}
            <AccordionItem value="contexto_social" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <span>Contexto Social</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.contexto_social || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Histórico de Tratamentos */}
            <AccordionItem value="historico_tratamentos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  <span>Histórico de Tratamentos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.historico_tratamentos || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Expectativas */}
            <AccordionItem value="expectativas" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span>Expectativas em Relação à Terapia</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.expectativas_terapia || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Fatores de Risco */}
            <AccordionItem value="fatores_risco" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <span>Fatores de Risco</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.fatores_risco || <span className="italic text-muted-foreground">Não identificados</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Fatores de Proteção */}
            <AccordionItem value="fatores_protecao" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Fatores de Proteção</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.fatores_protecao || <span className="italic text-muted-foreground">Não identificados</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Observações */}
            {currentAnamnese?.observacoes && (
              <AccordionItem value="observacoes">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Observações Adicionais</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {currentAnamnese.observacoes}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Anamneses
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {anamneseHistory.map((anamnese) => (
                <Card
                  key={anamnese.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    anamnese.is_current ? 'border-primary' : ''
                  }`}
                  onClick={() => handleViewVersion(anamnese)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={anamnese.is_current ? 'default' : 'secondary'}>
                          v{anamnese.version}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {format(parseISO(anamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {anamnese.created_by_name && (
                            <p className="text-xs text-muted-foreground">
                              por {anamnese.created_by_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Anamnese Psicológica - Versão {selectedVersion?.version}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedVersion && (
              <div className="space-y-4 pr-4">
                <div className="text-sm text-muted-foreground">
                  Registrado em{' '}
                  {format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {selectedVersion.created_by_name && ` por ${selectedVersion.created_by_name}`}
                </div>

                <div className="space-y-4">
                  <Section title="Queixa Principal" content={selectedVersion.queixa_principal} />
                  <Section title="Histórico Emocional e Comportamental" content={selectedVersion.historico_emocional_comportamental} />
                  <Section title="Contexto Familiar" content={selectedVersion.contexto_familiar} />
                  <Section title="Contexto Social" content={selectedVersion.contexto_social} />
                  <Section title="Histórico de Tratamentos" content={selectedVersion.historico_tratamentos} />
                  <Section title="Expectativas em Relação à Terapia" content={selectedVersion.expectativas_terapia} />
                  <Section title="Fatores de Risco" content={selectedVersion.fatores_risco} />
                  <Section title="Fatores de Proteção" content={selectedVersion.fatores_protecao} />
                  {selectedVersion.observacoes && (
                    <Section title="Observações" content={selectedVersion.observacoes} />
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <p className="text-sm whitespace-pre-wrap">
        {content || <span className="italic text-muted-foreground">Não informado</span>}
      </p>
    </div>
  );
}
