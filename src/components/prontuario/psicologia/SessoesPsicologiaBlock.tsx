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
  Timer
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { 
  SessaoPsicologia, 
  SessaoFormData,
  StatusSessao,
  statusSessaoConfig 
} from "@/hooks/prontuario/psicologia/useSessoesPsicologiaData";

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
  abordagem_terapeutica: '',
  relato_paciente: '',
  intervencoes_realizadas: '',
  observacoes_terapeuta: '',
  encaminhamentos_tarefas: '',
};

/**
 * SESSÕES PSICOLÓGICAS - Bloco exclusivo para Psicologia
 * 
 * Cada sessão registra:
 * - Data e duração
 * - Abordagem terapêutica utilizada
 * - Relato do paciente
 * - Intervenções realizadas
 * - Observações do terapeuta
 * - Encaminhamentos ou tarefas
 * 
 * Regras:
 * - Exibidas em ordem cronológica (mais recente primeiro)
 * - Nunca podem ser apagadas automaticamente
 * - Após assinadas, não podem ser editadas
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

  const handleOpenForm = () => {
    setFormData({
      ...EMPTY_FORM,
      data_sessao: new Date().toISOString(),
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData(EMPTY_FORM);
  };

  const handleSaveDraft = async () => {
    await onSave({ ...formData, assinar: false });
    handleCloseForm();
  };

  const handleSaveAndSign = async () => {
    await onSave({ ...formData, assinar: true });
    handleCloseForm();
  };

  const handleViewSessao = (sessao: SessaoPsicologia) => {
    setSelectedSessao(sessao);
  };

  const handleSignSessao = async (sessaoId: string) => {
    if (onSign) {
      await onSign(sessaoId);
      setSelectedSessao(null);
    }
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
          <h2 className="text-lg font-semibold">Sessões de Terapia</h2>
          <Badge variant="secondary">{sessoes.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sessão
          </Button>
        )}
      </div>

      {/* Sessões List */}
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
                <Plus className="h-4 w-4 mr-2" />
                Nova Sessão
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {sessoes.map((sessao) => (
            <div key={sessao.id} className="relative pl-10 pb-4 last:pb-0">
              {/* Timeline dot */}
              <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 ${
                sessao.status === 'assinada' 
                  ? 'bg-green-500 border-green-300' 
                  : 'bg-yellow-500 border-yellow-300'
              }`} />
              
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => handleViewSessao(sessao)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {sessao.duracao_minutos} min
                        </Badge>
                        <Badge className={statusConfig[sessao.status].color}>
                          {sessao.status === 'assinada' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {statusConfig[sessao.status].label}
                        </Badge>
                      </div>
                      
                      {/* Date and professional */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(parseISO(sessao.data_sessao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{sessao.profissional_nome}</span>
                        </div>
                      </div>
                      
                      {/* Preview */}
                      {sessao.abordagem_terapeutica && (
                        <p className="text-sm text-primary font-medium mb-1">
                          {sessao.abordagem_terapeutica}
                        </p>
                      )}
                      {sessao.relato_paciente && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {sessao.relato_paciente}
                        </p>
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
              Nova Sessão de Terapia
            </DialogTitle>
            <DialogDescription>
              Registre os dados da sessão. Após assinada, a sessão não poderá ser alterada.
            </DialogDescription>
          </DialogHeader>

          {/* Current professional info */}
          {currentProfessionalName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <User className="h-4 w-4" />
              <span>Terapeuta: <strong>{currentProfessionalName}</strong></span>
            </div>
          )}

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Data e Duração */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Data e Hora da Sessão
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formData.data_sessao.slice(0, 16)}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      data_sessao: new Date(e.target.value).toISOString() 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" />
                    Duração (minutos)
                  </Label>
                  <Input
                    type="number"
                    min={15}
                    max={180}
                    value={formData.duracao_minutos}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duracao_minutos: parseInt(e.target.value) || 50 
                    }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Abordagem Terapêutica */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Abordagem Terapêutica
                </Label>
                <p className="text-xs text-muted-foreground">
                  Técnica ou abordagem utilizada na sessão (ex: TCC, Psicodinâmica, Gestalt)
                </p>
                <Input
                  placeholder="Ex: Terapia Cognitivo-Comportamental"
                  value={formData.abordagem_terapeutica}
                  onChange={(e) => setFormData(prev => ({ ...prev, abordagem_terapeutica: e.target.value }))}
                />
              </div>

              {/* Relato do Paciente */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Relato do Paciente <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  O que o paciente trouxe para a sessão
                </p>
                <Textarea
                  placeholder="Principais temas, queixas, sentimentos e conteúdos trazidos pelo paciente..."
                  value={formData.relato_paciente}
                  onChange={(e) => setFormData(prev => ({ ...prev, relato_paciente: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Intervenções Realizadas */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Intervenções Realizadas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Técnicas aplicadas, exercícios realizados, insights trabalhados
                </p>
                <Textarea
                  placeholder="Técnicas utilizadas, exercícios propostos, reestruturação cognitiva, etc..."
                  value={formData.intervencoes_realizadas}
                  onChange={(e) => setFormData(prev => ({ ...prev, intervencoes_realizadas: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Observações do Terapeuta */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-500" />
                  Observações do Terapeuta
                </Label>
                <p className="text-xs text-muted-foreground">
                  Impressões clínicas, hipóteses, pontos de atenção
                </p>
                <Textarea
                  placeholder="Observações sobre o estado emocional, comportamento, resistências, progressos..."
                  value={formData.observacoes_terapeuta}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes_terapeuta: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Encaminhamentos e Tarefas */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-orange-500" />
                  Encaminhamentos e Tarefas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Tarefas de casa, exercícios para a semana, encaminhamentos
                </p>
                <Textarea
                  placeholder="Tarefas propostas para casa, exercícios de autoobservação, encaminhamentos..."
                  value={formData.encaminhamentos_tarefas}
                  onChange={(e) => setFormData(prev => ({ ...prev, encaminhamentos_tarefas: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </ScrollArea>

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleSaveDraft} 
              disabled={saving || !formData.relato_paciente.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <Button 
              onClick={handleSaveAndSign} 
              disabled={saving || !formData.relato_paciente.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Salvar e Assinar
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
              Detalhes da Sessão
            </DialogTitle>
            {selectedSessao && (
              <DialogDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(selectedSessao.data_sessao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  {selectedSessao.duracao_minutos} min
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedSessao.profissional_nome}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedSessao && (
            <>
              {/* Status badges */}
              <div className="flex items-center gap-2">
                <Badge className={statusConfig[selectedSessao.status].color}>
                  {selectedSessao.status === 'assinada' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {statusConfig[selectedSessao.status].label}
                </Badge>
                {selectedSessao.assinada_em && (
                  <span className="text-xs text-muted-foreground">
                    Assinada em {format(parseISO(selectedSessao.assinada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>

              <ScrollArea className="flex-1 max-h-[400px]">
                <div className="space-y-6 pr-4">
                  {/* Abordagem */}
                  {selectedSessao.abordagem_terapeutica && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4" />
                        Abordagem Terapêutica
                      </Label>
                      <p className="text-sm font-medium bg-muted/50 p-3 rounded-lg">
                        {selectedSessao.abordagem_terapeutica}
                      </p>
                    </div>
                  )}

                  {/* Relato do Paciente */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      Relato do Paciente
                    </Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedSessao.relato_paciente || <span className="italic text-muted-foreground">Não informado</span>}
                    </p>
                  </div>

                  <Separator />

                  {/* Intervenções */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4" />
                      Intervenções Realizadas
                    </Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedSessao.intervencoes_realizadas || <span className="italic text-muted-foreground">Não informado</span>}
                    </p>
                  </div>

                  {/* Observações */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4" />
                      Observações do Terapeuta
                    </Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedSessao.observacoes_terapeuta || <span className="italic text-muted-foreground">Não informado</span>}
                    </p>
                  </div>

                  <Separator />

                  {/* Encaminhamentos */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Encaminhamentos e Tarefas
                    </Label>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedSessao.encaminhamentos_tarefas || <span className="italic text-muted-foreground">Nenhum encaminhamento</span>}
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                {/* Sign button for drafts owned by current professional */}
                {selectedSessao.status === 'rascunho' && 
                 selectedSessao.profissional_id === currentProfessionalId && 
                 onSign && (
                  <Button 
                    variant="default" 
                    onClick={() => handleSignSessao(selectedSessao.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Assinar Sessão
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedSessao(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
