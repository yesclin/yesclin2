import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus,
  FileText,
  Clock,
  User,
  CheckCircle,
  Save,
  X,
  ChevronRight,
  Brain,
  MessageSquare,
  Lightbulb,
  ClipboardCheck,
  Eye,
  Calendar,
  Timer,
  Hash,
  AlertTriangle,
  SmilePlus,
  ShieldAlert,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { 
  SessaoPsicologia, 
  SessaoFormData,
  StatusSessao,
} from "@/hooks/prontuario/psicologia/useSessoesPsicologiaData";
import { INTERVENCOES_OPTIONS, ENCAMINHAMENTOS_OPTIONS } from "@/hooks/prontuario/psicologia/useSessoesPsicologiaData";

interface SessoesPsicologiaBlockProps {
  sessoes: SessaoPsicologia[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  onSave: (data: SessaoFormData & { assinar: boolean }) => Promise<void>;
  onSign?: (sessaoId: string) => Promise<void>;
}

const statusConfig: Record<StatusSessao, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  assinada: { label: 'Assinada', color: 'bg-green-100 text-green-700 border-green-300' },
};

const EMPTY_FORM: SessaoFormData = {
  data_sessao: new Date().toISOString(),
  duracao_minutos: 50,
  tema_central: '',
  abordagem_terapeutica: '',
  relato_paciente: '',
  intervencoes_realizadas: '',
  intervencoes_tags: [],
  observacoes_terapeuta: '',
  encaminhamentos_tarefas: '',
  encaminhamentos_tags: [],
  risco_interno: '',
  humor_paciente: null,
};

/**
 * EVOLUÇÕES / SESSÕES PSICOLÓGICAS — Bloco exclusivo para Psicologia
 * 
 * Estrutura por sessão:
 * - Contador automático (Sessão 1, 2, 3...)
 * - Tema central
 * - Relato do paciente
 * - Intervenções realizadas (tags multi-select)
 * - Observações clínicas
 * - Encaminhamentos/Tarefas (tags multi-select)
 * - Humor do paciente (opcional, 1-10)
 * - Campo interno de risco (opcional)
 */
export function SessoesPsicologiaBlock({
  sessoes,
  loading = false,
  saving = false,
  canEdit = false,
  currentProfessionalId,
  currentProfessionalName,
  onSave,
  onSign,
}: SessoesPsicologiaBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSessao, setSelectedSessao] = useState<SessaoPsicologia | null>(null);
  const [formData, setFormData] = useState<SessaoFormData>(EMPTY_FORM);
  const [customIntervencao, setCustomIntervencao] = useState('');
  const [customEncaminhamento, setCustomEncaminhamento] = useState('');

  const nextSessionNumber = sessoes.length > 0 
    ? Math.max(...sessoes.map(s => s.numero_sessao || 0)) + 1 
    : 1;

  const handleOpenForm = () => {
    setFormData({ ...EMPTY_FORM, data_sessao: new Date().toISOString() });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData(EMPTY_FORM);
    setCustomIntervencao('');
    setCustomEncaminhamento('');
  };

  const handleSaveDraft = async () => {
    await onSave({ ...formData, assinar: false });
    handleCloseForm();
  };

  const handleSaveAndSign = async () => {
    await onSave({ ...formData, assinar: true });
    handleCloseForm();
  };

  const toggleTag = (field: 'intervencoes_tags' | 'encaminhamentos_tags', tag: string) => {
    setFormData(prev => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(tag) 
          ? current.filter(t => t !== tag) 
          : [...current, tag],
      };
    });
  };

  const addCustomTag = (field: 'intervencoes_tags' | 'encaminhamentos_tags', value: string, resetFn: (v: string) => void) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
    resetFn('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Evoluções — Sessões de Terapia</h2>
          <Badge variant="secondary">{sessoes.length} sessões</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sessão (#{nextSessionNumber})
          </Button>
        )}
      </div>

      {/* Sessions List */}
      {sessoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhuma sessão registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre a primeira sessão de terapia deste paciente.
            </p>
            {canEdit && (
              <Button onClick={handleOpenForm}>
                <Plus className="h-4 w-4 mr-2" /> Nova Sessão
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {sessoes.map((sessao) => (
            <div key={sessao.id} className="relative pl-10 pb-4 last:pb-0">
              <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 ${
                sessao.status === 'assinada' 
                  ? 'bg-green-500 border-green-300' 
                  : 'bg-yellow-500 border-yellow-300'
              }`} />
              
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => setSelectedSessao(sessao)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {sessao.numero_sessao && (
                          <Badge variant="outline" className="flex items-center gap-1 font-mono">
                            <Hash className="h-3 w-3" />
                            Sessão {sessao.numero_sessao}
                          </Badge>
                        )}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Timer className="h-3 w-3" /> {sessao.duracao_minutos} min
                        </Badge>
                        <Badge className={statusConfig[sessao.status].color}>
                          {sessao.status === 'assinada' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {statusConfig[sessao.status].label}
                        </Badge>
                        {sessao.humor_paciente && (
                          <Badge variant="secondary" className="text-xs">
                            <SmilePlus className="h-3 w-3 mr-1" /> Humor: {sessao.humor_paciente}/10
                          </Badge>
                        )}
                        {sessao.risco_interno && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <ShieldAlert className="h-3 w-3 mr-1" /> Risco
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(parseISO(sessao.data_sessao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> {sessao.profissional_nome}
                        </span>
                      </div>

                      {sessao.tema_central && (
                        <p className="text-sm font-medium text-primary mb-1">{sessao.tema_central}</p>
                      )}
                      
                      {sessao.relato_paciente && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{sessao.relato_paciente}</p>
                      )}

                      {sessao.intervencoes_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sessao.intervencoes_tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* New Session Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Nova Evolução — Sessão #{nextSessionNumber}
            </DialogTitle>
            <DialogDescription>
              Preencha parcial ou completamente. Salve como rascunho a qualquer momento.
            </DialogDescription>
          </DialogHeader>

          {currentProfessionalName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <User className="h-4 w-4" />
              <span>Terapeuta: <strong>{currentProfessionalName}</strong></span>
            </div>
          )}

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Data, Duração e Humor */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Data
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formData.data_sessao.slice(0, 16)}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_sessao: new Date(e.target.value).toISOString() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" /> Duração (min)
                  </Label>
                  <Input
                    type="number"
                    min={15}
                    max={180}
                    value={formData.duracao_minutos}
                    onChange={(e) => setFormData(prev => ({ ...prev, duracao_minutos: parseInt(e.target.value) || 50 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <SmilePlus className="h-4 w-4 text-yellow-500" /> Humor (opcional)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={formData.humor_paciente ? [formData.humor_paciente] : [5]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, humor_paciente: v }))}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="min-w-[32px] text-center">
                      {formData.humor_paciente || '—'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tema Central */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Tema Central da Sessão
                </Label>
                <Input
                  placeholder="Ex: Ansiedade social, Luto, Conflito familiar..."
                  value={formData.tema_central}
                  onChange={(e) => setFormData(prev => ({ ...prev, tema_central: e.target.value }))}
                />
              </div>

              {/* Relato do Paciente */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Relato / Evolução do Paciente
                </Label>
                <Textarea
                  placeholder="Principais temas, queixas, sentimentos e conteúdos trazidos pelo paciente..."
                  value={formData.relato_paciente}
                  onChange={(e) => setFormData(prev => ({ ...prev, relato_paciente: e.target.value }))}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Intervenções - Tags */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Intervenções Realizadas
                </Label>
                <div className="flex flex-wrap gap-2">
                  {INTERVENCOES_OPTIONS.map(opt => (
                    <Badge
                      key={opt}
                      variant={formData.intervencoes_tags.includes(opt) ? "default" : "outline"}
                      className="cursor-pointer transition-colors hover:opacity-80"
                      onClick={() => toggleTag('intervencoes_tags', opt)}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
                {/* Custom tag */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Outra intervenção..."
                    value={customIntervencao}
                    onChange={(e) => setCustomIntervencao(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag('intervencoes_tags', customIntervencao, setCustomIntervencao))}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCustomTag('intervencoes_tags', customIntervencao, setCustomIntervencao)}
                    disabled={!customIntervencao.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {/* Custom tags display */}
                {formData.intervencoes_tags.filter(t => !INTERVENCOES_OPTIONS.includes(t as any)).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.intervencoes_tags.filter(t => !INTERVENCOES_OPTIONS.includes(t as any)).map(tag => (
                      <Badge key={tag} variant="default" className="cursor-pointer" onClick={() => toggleTag('intervencoes_tags', tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Free text field for additional details */}
                <Textarea
                  placeholder="Detalhes adicionais sobre intervenções (opcional)..."
                  value={formData.intervencoes_realizadas}
                  onChange={(e) => setFormData(prev => ({ ...prev, intervencoes_realizadas: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Observações do Terapeuta */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-500" />
                  Observações Clínicas
                </Label>
                <Textarea
                  placeholder="Impressões sobre estado emocional, comportamento, resistências, progressos..."
                  value={formData.observacoes_terapeuta}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes_terapeuta: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Encaminhamentos - Tags */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-orange-500" />
                  Encaminhamentos / Tarefas
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ENCAMINHAMENTOS_OPTIONS.map(opt => (
                    <Badge
                      key={opt}
                      variant={formData.encaminhamentos_tags.includes(opt) ? "default" : "outline"}
                      className="cursor-pointer transition-colors hover:opacity-80"
                      onClick={() => toggleTag('encaminhamentos_tags', opt)}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Outro encaminhamento..."
                    value={customEncaminhamento}
                    onChange={(e) => setCustomEncaminhamento(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag('encaminhamentos_tags', customEncaminhamento, setCustomEncaminhamento))}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCustomTag('encaminhamentos_tags', customEncaminhamento, setCustomEncaminhamento)}
                    disabled={!customEncaminhamento.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Detalhes adicionais sobre tarefas e encaminhamentos (opcional)..."
                  value={formData.encaminhamentos_tarefas}
                  onChange={(e) => setFormData(prev => ({ ...prev, encaminhamentos_tarefas: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Campo Interno de Risco (Opcional) */}
              <div className="space-y-2 border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20">
                <Label className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <ShieldAlert className="h-4 w-4" />
                  Campo Interno de Risco (opcional, confidencial)
                </Label>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">
                  Registre sinais de ideação suicida, autolesão ou risco iminente. Este campo não é exportado em relatórios.
                </p>
                <Textarea
                  placeholder="Observações sobre risco (uso interno)..."
                  value={formData.risco_interno}
                  onChange={(e) => setFormData(prev => ({ ...prev, risco_interno: e.target.value }))}
                  rows={2}
                  className="resize-none border-red-200 dark:border-red-800"
                />
              </div>
            </div>
          </ScrollArea>

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <Button onClick={handleSaveAndSign} disabled={saving}>
              <CheckCircle className="h-4 w-4 mr-1" /> Salvar e Assinar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Session Dialog */}
      <Dialog open={!!selectedSessao} onOpenChange={() => setSelectedSessao(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedSessao?.numero_sessao ? `Sessão #${selectedSessao.numero_sessao}` : 'Detalhes da Sessão'}
            </DialogTitle>
            {selectedSessao && (
              <DialogDescription className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(selectedSessao.data_sessao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-4 w-4" /> {selectedSessao.duracao_minutos} min
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" /> {selectedSessao.profissional_nome}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedSessao && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusConfig[selectedSessao.status].color}>
                  {selectedSessao.status === 'assinada' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {statusConfig[selectedSessao.status].label}
                </Badge>
                {selectedSessao.humor_paciente && (
                  <Badge variant="secondary">
                    <SmilePlus className="h-3 w-3 mr-1" /> Humor: {selectedSessao.humor_paciente}/10
                  </Badge>
                )}
                {selectedSessao.risco_interno && (
                  <Badge variant="destructive" className="animate-pulse">
                    <ShieldAlert className="h-3 w-3 mr-1" /> Risco registrado
                  </Badge>
                )}
                {selectedSessao.assinada_em && (
                  <span className="text-xs text-muted-foreground">
                    Assinada em {format(parseISO(selectedSessao.assinada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {selectedSessao.tema_central && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" /> Tema Central
                      </h4>
                      <p className="text-sm font-medium text-primary">{selectedSessao.tema_central}</p>
                    </div>
                  )}

                  {selectedSessao.relato_paciente && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" /> Relato do Paciente
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedSessao.relato_paciente}</p>
                    </div>
                  )}

                  {(selectedSessao.intervencoes_tags?.length > 0 || selectedSessao.intervencoes_realizadas) && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" /> Intervenções
                      </h4>
                      {selectedSessao.intervencoes_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {selectedSessao.intervencoes_tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      {selectedSessao.intervencoes_realizadas && (
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{selectedSessao.intervencoes_realizadas}</p>
                      )}
                    </div>
                  )}

                  {selectedSessao.observacoes_terapeuta && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Eye className="h-4 w-4 text-green-500" /> Observações Clínicas
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedSessao.observacoes_terapeuta}</p>
                    </div>
                  )}

                  {(selectedSessao.encaminhamentos_tags?.length > 0 || selectedSessao.encaminhamentos_tarefas) && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-orange-500" /> Encaminhamentos / Tarefas
                      </h4>
                      {selectedSessao.encaminhamentos_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {selectedSessao.encaminhamentos_tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      {selectedSessao.encaminhamentos_tarefas && (
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{selectedSessao.encaminhamentos_tarefas}</p>
                      )}
                    </div>
                  )}

                  {selectedSessao.risco_interno && (
                    <div className="space-y-1 border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50/50 dark:bg-red-950/20">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                        <ShieldAlert className="h-4 w-4" /> Campo Interno de Risco
                      </h4>
                      <p className="text-sm whitespace-pre-wrap text-red-600 dark:text-red-400">{selectedSessao.risco_interno}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Sign button */}
              {selectedSessao.status === 'rascunho' && canEdit && onSign && (
                <>
                  <Separator />
                  <DialogFooter>
                    <Button onClick={() => onSign(selectedSessao.id)} disabled={saving}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Assinar Sessão
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
