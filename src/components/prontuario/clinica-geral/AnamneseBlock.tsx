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
  DialogDescription,
  DialogFooter,
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
  FileText,
  Edit3,
  Save,
  X,
  Clock,
  User,
  History,
  AlertTriangle,
  Pill,
  Heart,
  Activity,
  Cigarette,
  Users,
  Stethoscope,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Estrutura de dados da Anamnese
 */
export interface AnamneseData {
  id: string;
  patient_id: string;
  version: number;
  queixa_principal: string;
  historia_doenca_atual: string;
  antecedentes_pessoais: string;
  antecedentes_familiares: string;
  habitos_vida: string;
  medicamentos_uso_continuo: string;
  alergias: string;
  comorbidades: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface AnamneseBlockProps {
  currentAnamnese: AnamneseData | null;
  anamneseHistory: AnamneseData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
}

/**
 * ANAMNESE - Bloco exclusivo para Clínica Geral
 * 
 * Contém:
 * - Queixa principal
 * - História da doença atual (HDA)
 * - Antecedentes pessoais
 * - Antecedentes familiares
 * - Hábitos de vida
 * - Uso contínuo de medicamentos
 * - Alergias
 * - Comorbidades
 * 
 * Regras:
 * - Não sobrescreve automaticamente anamneses anteriores
 * - Permite atualização manual (cria nova versão)
 * - Mantém histórico/versionamento completo
 */
export function AnamneseBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
}: AnamneseBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamneseData | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    queixa_principal: '',
    historia_doenca_atual: '',
    antecedentes_pessoais: '',
    antecedentes_familiares: '',
    habitos_vida: '',
    medicamentos_uso_continuo: '',
    alergias: '',
    comorbidades: '',
  });

  const handleStartEdit = () => {
    if (currentAnamnese) {
      setFormData({
        queixa_principal: currentAnamnese.queixa_principal || '',
        historia_doenca_atual: currentAnamnese.historia_doenca_atual || '',
        antecedentes_pessoais: currentAnamnese.antecedentes_pessoais || '',
        antecedentes_familiares: currentAnamnese.antecedentes_familiares || '',
        habitos_vida: currentAnamnese.habitos_vida || '',
        medicamentos_uso_continuo: currentAnamnese.medicamentos_uso_continuo || '',
        alergias: currentAnamnese.alergias || '',
        comorbidades: currentAnamnese.comorbidades || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      queixa_principal: '',
      historia_doenca_atual: '',
      antecedentes_pessoais: '',
      antecedentes_familiares: '',
      habitos_vida: '',
      medicamentos_uso_continuo: '',
      alergias: '',
      comorbidades: '',
    });
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsEditing(false);
  };

  const handleViewVersion = (version: AnamneseData) => {
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

  // Empty state - no anamnese yet
  if (!currentAnamnese && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhuma anamnese registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre a anamnese inicial do paciente para começar o acompanhamento clínico.
          </p>
          {canEdit && (
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
              {currentAnamnese ? 'Atualizar Anamnese' : 'Nova Anamnese'}
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
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Queixa Principal
                </Label>
                <Textarea
                  placeholder="Descreva a queixa principal do paciente..."
                  value={formData.queixa_principal}
                  onChange={(e) => setFormData(prev => ({ ...prev, queixa_principal: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* HDA */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  História da Doença Atual (HDA)
                </Label>
                <Textarea
                  placeholder="Descreva a evolução da doença atual, início dos sintomas, fatores de melhora/piora..."
                  value={formData.historia_doenca_atual}
                  onChange={(e) => setFormData(prev => ({ ...prev, historia_doenca_atual: e.target.value }))}
                  rows={4}
                />
              </div>

              <Separator />

              {/* Antecedentes Pessoais */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-500" />
                  Antecedentes Pessoais
                </Label>
                <Textarea
                  placeholder="Doenças prévias, cirurgias, internações, traumas..."
                  value={formData.antecedentes_pessoais}
                  onChange={(e) => setFormData(prev => ({ ...prev, antecedentes_pessoais: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Antecedentes Familiares */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Antecedentes Familiares
                </Label>
                <Textarea
                  placeholder="Histórico familiar de doenças (diabetes, hipertensão, câncer, cardiopatias...)"
                  value={formData.antecedentes_familiares}
                  onChange={(e) => setFormData(prev => ({ ...prev, antecedentes_familiares: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Hábitos de Vida */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Cigarette className="h-4 w-4 text-orange-500" />
                  Hábitos de Vida
                </Label>
                <Textarea
                  placeholder="Tabagismo, etilismo, atividade física, alimentação, sono..."
                  value={formData.habitos_vida}
                  onChange={(e) => setFormData(prev => ({ ...prev, habitos_vida: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Medicamentos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  Medicamentos de Uso Contínuo
                </Label>
                <Textarea
                  placeholder="Liste os medicamentos em uso contínuo com dosagem e frequência..."
                  value={formData.medicamentos_uso_continuo}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicamentos_uso_continuo: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Alergias */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Alergias
                </Label>
                <Textarea
                  placeholder="Alergias medicamentosas, alimentares, ambientais..."
                  value={formData.alergias}
                  onChange={(e) => setFormData(prev => ({ ...prev, alergias: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Comorbidades */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Comorbidades
                </Label>
                <Textarea
                  placeholder="Condições crônicas associadas (HAS, DM, obesidade, asma...)"
                  value={formData.comorbidades}
                  onChange={(e) => setFormData(prev => ({ ...prev, comorbidades: e.target.value }))}
                  rows={2}
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
          <h2 className="text-lg font-semibold">Anamnese</h2>
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
          <Accordion type="multiple" defaultValue={['queixa', 'hda']} className="w-full">
            {/* Queixa Principal */}
            <AccordionItem value="queixa" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span>Queixa Principal</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.queixa_principal || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* HDA */}
            <AccordionItem value="hda" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>História da Doença Atual (HDA)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.historia_doenca_atual || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Antecedentes Pessoais */}
            <AccordionItem value="antecedentes_pessoais" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-500" />
                  <span>Antecedentes Pessoais</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.antecedentes_pessoais || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Antecedentes Familiares */}
            <AccordionItem value="antecedentes_familiares" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Antecedentes Familiares</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.antecedentes_familiares || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Hábitos de Vida */}
            <AccordionItem value="habitos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span>Hábitos de Vida</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.habitos_vida || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Medicamentos */}
            <AccordionItem value="medicamentos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <span>Medicamentos de Uso Contínuo</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.medicamentos_uso_continuo || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Alergias */}
            <AccordionItem value="alergias" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Alergias</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.alergias || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Comorbidades */}
            <AccordionItem value="comorbidades">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span>Comorbidades</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.comorbidades || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>
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
            <DialogDescription>
              Visualize as versões anteriores da anamnese do paciente
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {anamneseHistory.map((anamnese) => (
                <div
                  key={anamnese.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    anamnese.is_current ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleViewVersion(anamnese)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={anamnese.is_current ? 'default' : 'outline'}>
                        v{anamnese.version}
                      </Badge>
                      {anamnese.is_current && (
                        <Badge variant="secondary" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(anamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {anamnese.created_by_name && ` • ${anamnese.created_by_name}`}
                  </p>
                </div>
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
              <FileText className="h-5 w-5" />
              Anamnese - Versão {selectedVersion?.version}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {selectedVersion?.created_by_name && ` • ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            {selectedVersion && (
              <div className="space-y-4 pr-4">
                <div>
                  <Label className="text-muted-foreground">Queixa Principal</Label>
                  <p className="text-sm mt-1">{selectedVersion.queixa_principal || '-'}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">História da Doença Atual</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.historia_doenca_atual || '-'}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Antecedentes Pessoais</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.antecedentes_pessoais || '-'}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Antecedentes Familiares</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.antecedentes_familiares || '-'}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Hábitos de Vida</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.habitos_vida || '-'}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Medicamentos de Uso Contínuo</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.medicamentos_uso_continuo || '-'}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Alergias</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.alergias || '-'}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Comorbidades</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.comorbidades || '-'}</p>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVersion(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
