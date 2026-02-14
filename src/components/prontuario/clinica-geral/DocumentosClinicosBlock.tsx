import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Printer,
  Pill,
  Calendar,
  User,
  Clock,
  XCircle,
  ScrollText,
  Ban,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  DocumentoClinico,
  ConteudoReceituario,
  ConteudoAtestado,
  MedicamentoItem,
} from '@/hooks/prontuario/clinica-geral/useDocumentosClinicosData';

// ─── Types ──────────────────────────────────────────
type ViewMode = 'list' | 'receituario' | 'atestado';

interface DocumentosClinicosBlockProps {
  documentos: DocumentoClinico[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  currentProfessionalName?: string;
  onSaveReceituario: (conteudo: ConteudoReceituario) => Promise<string | null>;
  onSaveAtestado: (conteudo: ConteudoAtestado) => Promise<string | null>;
  onCancel: (id: string, motivo: string) => Promise<boolean>;
  patientName?: string;
}

// ─── Empty States ──────────────────────────────────
const EMPTY_MED: MedicamentoItem = { nome: '', dosagem: '', frequencia: '', duracao: '' };

// ─── Component ─────────────────────────────────────
export function DocumentosClinicosBlock({
  documentos,
  loading,
  saving,
  canEdit,
  currentProfessionalName,
  onSaveReceituario,
  onSaveAtestado,
  onCancel,
  patientName,
}: DocumentosClinicosBlockProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewingDoc, setViewingDoc] = useState<DocumentoClinico | null>(null);
  const [cancelDocId, setCancelDocId] = useState<string | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');

  // ── Receituário Form State ──
  const [medicamentos, setMedicamentos] = useState<MedicamentoItem[]>([{ ...EMPTY_MED }]);
  const [obsGerais, setObsGerais] = useState('');

  // ── Atestado Form State ──
  const [tipoAfastamento, setTipoAfastamento] = useState<'dias' | 'periodo'>('dias');
  const [diasAfastamento, setDiasAfastamento] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [cid, setCid] = useState('');
  const [obsAtestado, setObsAtestado] = useState('');

  const resetReceituario = () => {
    setMedicamentos([{ ...EMPTY_MED }]);
    setObsGerais('');
  };

  const resetAtestado = () => {
    setTipoAfastamento('dias');
    setDiasAfastamento('');
    setDataInicio('');
    setDataFim('');
    setCid('');
    setObsAtestado('');
  };

  const addMedicamento = () => setMedicamentos(prev => [...prev, { ...EMPTY_MED }]);
  const removeMedicamento = (index: number) => {
    if (medicamentos.length <= 1) return;
    setMedicamentos(prev => prev.filter((_, i) => i !== index));
  };
  const updateMedicamento = (index: number, field: keyof MedicamentoItem, value: string) => {
    setMedicamentos(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleSaveReceituario = async () => {
    const validMeds = medicamentos.filter(m => m.nome.trim());
    if (validMeds.length === 0) return;
    const conteudo: ConteudoReceituario = { medicamentos: validMeds, observacoes_gerais: obsGerais || undefined };
    const id = await onSaveReceituario(conteudo);
    if (id) {
      resetReceituario();
      setViewMode('list');
    }
  };

  const handleSaveAtestado = async () => {
    const conteudo: ConteudoAtestado = {
      tipo_afastamento: tipoAfastamento,
      ...(tipoAfastamento === 'dias' ? { dias: parseInt(diasAfastamento) || 1 } : { data_inicio: dataInicio, data_fim: dataFim }),
      cid: cid || undefined,
      observacao: obsAtestado || undefined,
    };
    const id = await onSaveAtestado(conteudo);
    if (id) {
      resetAtestado();
      setViewMode('list');
    }
  };

  const handleCancel = async () => {
    if (!cancelDocId || !cancelMotivo.trim()) return;
    await onCancel(cancelDocId, cancelMotivo);
    setCancelDocId(null);
    setCancelMotivo('');
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

  // ─── LIST VIEW ──────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Documentos Clínicos
          </h2>
          <Badge variant="secondary">{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</Badge>
        </div>

        {/* Action Cards */}
        {canEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all" onClick={() => setViewMode('receituario')}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Pill className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Novo Receituário</h3>
                  <p className="text-sm text-muted-foreground">Prescrever medicamentos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all" onClick={() => setViewMode('atestado')}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Novo Atestado</h3>
                  <p className="text-sm text-muted-foreground">Emitir atestado médico</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Document History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de Documentos Emitidos</CardTitle>
          </CardHeader>
          <CardContent>
            {documentos.length === 0 ? (
              <div className="py-8 text-center">
                <ScrollText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum documento clínico emitido.</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {documentos.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.tipo === 'receituario' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                          {doc.tipo === 'receituario'
                            ? <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            : <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {doc.tipo === 'receituario' ? 'Receituário' : 'Atestado'}
                            </span>
                            <Badge variant={doc.status === 'emitido' ? 'default' : 'destructive'} className="text-[10px]">
                              {doc.status === 'emitido' ? 'Emitido' : 'Cancelado'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(doc.created_at), "HH:mm")}
                            </span>
                            {doc.profissional_nome && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {doc.profissional_nome}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingDoc(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {doc.status === 'emitido' && canEdit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setCancelDocId(doc.id)}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* View Document Dialog */}
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewingDoc?.tipo === 'receituario' ? <Pill className="h-5 w-5 text-blue-600" /> : <FileText className="h-5 w-5 text-emerald-600" />}
                {viewingDoc?.tipo === 'receituario' ? 'Receituário' : 'Atestado'}
                <Badge variant={viewingDoc?.status === 'emitido' ? 'default' : 'destructive'} className="ml-2">
                  {viewingDoc?.status === 'emitido' ? 'Emitido' : 'Cancelado'}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {viewingDoc && (
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Paciente:</span> {patientName || '—'}</p>
                  <p><span className="font-medium">Profissional:</span> {viewingDoc.profissional_nome || '—'}</p>
                  <p><span className="font-medium">Data:</span> {format(parseISO(viewingDoc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
                <Separator />
                {viewingDoc.tipo === 'receituario' ? (
                  <ReceituarioView conteudo={viewingDoc.conteudo_json as ConteudoReceituario} />
                ) : (
                  <AtestadoView conteudo={viewingDoc.conteudo_json as ConteudoAtestado} />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Confirmation */}
        <AlertDialog open={!!cancelDocId} onOpenChange={() => { setCancelDocId(null); setCancelMotivo(''); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Documento</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Informe o motivo do cancelamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Motivo do cancelamento..."
              value={cancelMotivo}
              onChange={e => setCancelMotivo(e.target.value)}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} disabled={!cancelMotivo.trim() || saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ─── RECEITUÁRIO FORM ──────────────────────────
  if (viewMode === 'receituario') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            Novo Receituário
          </h2>
          <Button variant="outline" size="sm" onClick={() => { resetReceituario(); setViewMode('list'); }}>
            Voltar
          </Button>
        </div>

        {/* Header Info */}
        <Card>
          <CardContent className="p-4 text-sm space-y-1 bg-muted/30">
            <p><span className="font-medium">Paciente:</span> {patientName || '—'}</p>
            <p><span className="font-medium">Profissional:</span> {currentProfessionalName || '—'}</p>
            <p><span className="font-medium">Data:</span> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </CardContent>
        </Card>

        {/* Medicamentos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Medicamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {medicamentos.map((med, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Medicamento {idx + 1}</span>
                  {medicamentos.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMedicamento(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Nome do Medicamento *</Label>
                    <Input placeholder="Ex: Amoxicilina 500mg" value={med.nome} onChange={e => updateMedicamento(idx, 'nome', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Dosagem *</Label>
                    <Input placeholder="Ex: 500mg" value={med.dosagem} onChange={e => updateMedicamento(idx, 'dosagem', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Frequência *</Label>
                    <Input placeholder="Ex: 8/8h" value={med.frequencia} onChange={e => updateMedicamento(idx, 'frequencia', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Duração *</Label>
                    <Input placeholder="Ex: 7 dias" value={med.duracao} onChange={e => updateMedicamento(idx, 'duracao', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Observações</Label>
                    <Input placeholder="Tomar após refeição" value={med.observacoes || ''} onChange={e => updateMedicamento(idx, 'observacoes', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addMedicamento} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </Button>
          </CardContent>
        </Card>

        {/* Observações Gerais */}
        <Card>
          <CardContent className="pt-5">
            <Label className="text-xs">Observações Gerais</Label>
            <Textarea placeholder="Observações adicionais..." value={obsGerais} onChange={e => setObsGerais(e.target.value)} rows={3} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { resetReceituario(); setViewMode('list'); }}>Cancelar</Button>
          <Button onClick={handleSaveReceituario} disabled={saving || !medicamentos.some(m => m.nome.trim())}>
            <Printer className="h-4 w-4 mr-2" />
            {saving ? 'Emitindo...' : 'Emitir Receituário'}
          </Button>
        </div>
      </div>
    );
  }

  // ─── ATESTADO FORM ──────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          Novo Atestado
        </h2>
        <Button variant="outline" size="sm" onClick={() => { resetAtestado(); setViewMode('list'); }}>
          Voltar
        </Button>
      </div>

      {/* Header Info */}
      <Card>
        <CardContent className="p-4 text-sm space-y-1 bg-muted/30">
          <p><span className="font-medium">Paciente:</span> {patientName || '—'}</p>
          <p><span className="font-medium">Profissional:</span> {currentProfessionalName || '—'}</p>
          <p><span className="font-medium">Data:</span> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-5">
          {/* Tipo de Afastamento */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tipo de Afastamento</Label>
            <RadioGroup value={tipoAfastamento} onValueChange={v => setTipoAfastamento(v as 'dias' | 'periodo')} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="dias" id="dias" />
                <Label htmlFor="dias" className="cursor-pointer">X dias</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="periodo" id="periodo" />
                <Label htmlFor="periodo" className="cursor-pointer">Data início e fim</Label>
              </div>
            </RadioGroup>
          </div>

          {tipoAfastamento === 'dias' ? (
            <div className="max-w-[200px]">
              <Label className="text-xs">Quantidade de dias *</Label>
              <Input type="number" min="1" placeholder="Ex: 3" value={diasAfastamento} onChange={e => setDiasAfastamento(e.target.value)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Data início *</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Data fim *</Label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
            </div>
          )}

          <div className="max-w-[300px]">
            <Label className="text-xs">CID (opcional)</Label>
            <Input placeholder="Ex: J06.9" value={cid} onChange={e => setCid(e.target.value)} />
          </div>

          <div>
            <Label className="text-xs">Observação complementar</Label>
            <Textarea placeholder="Observações adicionais..." value={obsAtestado} onChange={e => setObsAtestado(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => { resetAtestado(); setViewMode('list'); }}>Cancelar</Button>
        <Button
          onClick={handleSaveAtestado}
          disabled={saving || (tipoAfastamento === 'dias' ? !diasAfastamento : !dataInicio || !dataFim)}
        >
          <Printer className="h-4 w-4 mr-2" />
          {saving ? 'Emitindo...' : 'Emitir Atestado'}
        </Button>
      </div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────

function ReceituarioView({ conteudo }: { conteudo: ConteudoReceituario }) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Medicamentos Prescritos</h4>
      {(conteudo.medicamentos || []).map((med, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-1 text-sm">
          <p className="font-medium">{i + 1}. {med.nome}</p>
          <div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
            <p>Dosagem: {med.dosagem}</p>
            <p>Freq.: {med.frequencia}</p>
            <p>Duração: {med.duracao}</p>
          </div>
          {med.observacoes && <p className="text-xs text-muted-foreground italic">{med.observacoes}</p>}
        </div>
      ))}
      {conteudo.observacoes_gerais && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Observações Gerais</p>
            <p className="text-sm">{conteudo.observacoes_gerais}</p>
          </div>
        </>
      )}
    </div>
  );
}

function AtestadoView({ conteudo }: { conteudo: ConteudoAtestado }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Afastamento</p>
        {conteudo.tipo_afastamento === 'dias' ? (
          <p>{conteudo.dias} dia{(conteudo.dias || 0) > 1 ? 's' : ''}</p>
        ) : (
          <p>De {conteudo.data_inicio ? format(parseISO(conteudo.data_inicio), 'dd/MM/yyyy') : '—'} até {conteudo.data_fim ? format(parseISO(conteudo.data_fim), 'dd/MM/yyyy') : '—'}</p>
        )}
      </div>
      {conteudo.cid && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">CID</p>
          <p>{conteudo.cid}</p>
        </div>
      )}
      {conteudo.observacao && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Observação</p>
          <p>{conteudo.observacao}</p>
        </div>
      )}
    </div>
  );
}
