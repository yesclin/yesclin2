import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Edit2, Copy, Trash2, Loader2,
  CalendarPlus, Bell, XCircle, CheckCircle, Zap,
  MessageCircle, Mail, ChevronRight, ChevronLeft, Lock,
} from "lucide-react";
import {
  useAutomationRules,
  EVENT_TYPE_LABELS,
  DELAY_TYPE_LABELS,
  type AutomationFormData,
  type AutomationRuleRow,
  type EventType,
  type DelayType,
  type AutomationChannel,
} from "@/hooks/useAutomationRules";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { DYNAMIC_FIELDS } from "@/types/comunicacao";

const EVENT_ICONS: Record<EventType, React.ElementType> = {
  appointment_created: CalendarPlus,
  appointment_reminder: Bell,
  appointment_cancelled: XCircle,
  appointment_completed: CheckCircle,
};

const emptyForm: AutomationFormData = {
  name: '',
  description: '',
  trigger_type: 'appointment_created',
  delay_type: 'immediate',
  delay_value: 0,
  channel: 'whatsapp',
  template_id: null,
  is_active: true,
  priority: 0,
};

const WIZARD_STEPS = [
  { key: 'event', label: 'Evento' },
  { key: 'timing', label: 'Quando Enviar' },
  { key: 'channel', label: 'Canal' },
  { key: 'message', label: 'Mensagem' },
  { key: 'activate', label: 'Ativar' },
];

export default function MarketingAutomacoes() {
  const {
    automations, loading, saving, maxAutomations, canCreateMore,
    createAutomation, updateAutomation, deleteAutomation,
    toggleAutomation, duplicateAutomation,
  } = useAutomationRules();
  const { templates } = useMessageTemplates();

  const [searchTerm, setSearchTerm] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRuleRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AutomationFormData>(emptyForm);
  const [wizardStep, setWizardStep] = useState(0);

  const activeCount = automations.filter((a) => a.is_active).length;

  const filteredAutomations = automations.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    EVENT_TYPE_LABELS[a.trigger_type as EventType]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenWizard = () => {
    if (!canCreateMore) {
      return;
    }
    setEditingId(null);
    setForm({ ...emptyForm, priority: automations.length + 1 });
    setWizardStep(0);
    setWizardOpen(true);
  };

  const handleOpenEdit = (automation: AutomationRuleRow) => {
    setEditingId(automation.id);
    setForm({
      name: automation.name,
      description: automation.description || '',
      trigger_type: automation.trigger_type as EventType,
      delay_type: (automation.delay_type || 'immediate') as DelayType,
      delay_value: automation.delay_value || 0,
      channel: (automation.channel || 'whatsapp') as AutomationChannel,
      template_id: automation.template_id,
      is_active: automation.is_active,
      priority: automation.priority,
    });
    setEditOpen(true);
  };

  const handleWizardSave = async () => {
    if (!form.name) {
      setForm(prev => ({ ...prev, name: `${EVENT_TYPE_LABELS[prev.trigger_type]} - ${DELAY_TYPE_LABELS[prev.delay_type]}` }));
    }
    const finalForm = {
      ...form,
      name: form.name || `${EVENT_TYPE_LABELS[form.trigger_type]} - ${DELAY_TYPE_LABELS[form.delay_type]}`,
    };
    await createAutomation(finalForm);
    setWizardOpen(false);
  };

  const handleEditSave = async () => {
    if (!editingId || !form.name) return;
    await updateAutomation(editingId, form);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedAutomation) return;
    await deleteAutomation(selectedAutomation.id);
    setDeleteOpen(false);
    setSelectedAutomation(null);
  };

  const needsDelayValue = form.delay_type !== 'immediate';

  const selectedTemplate = templates.find(t => t.id === form.template_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Automações</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {activeCount} ativas · {automations.length}/{maxAutomations === 0 ? '∞' : maxAutomations} criadas
              </p>
            </div>
            <Button size="sm" onClick={handleOpenWizard} disabled={!canCreateMore}>
              {!canCreateMore ? <Lock className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Nova Automação
            </Button>
          </div>
          {!canCreateMore && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Limite de {maxAutomations} automações atingido. Faça upgrade para o plano Pro para automações ilimitadas.
            </p>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar automações..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredAutomations.map((automation) => {
                const eventType = automation.trigger_type as EventType;
                const Icon = EVENT_ICONS[eventType] || Zap;
                const delayType = (automation.delay_type || 'immediate') as DelayType;

                return (
                  <div key={automation.id} className={`p-4 border rounded-lg transition-all ${automation.is_active ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 opacity-75'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${automation.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{automation.name}</h4>
                          {automation.description && <p className="text-xs text-muted-foreground mt-0.5">{automation.description}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{EVENT_TYPE_LABELS[eventType] || automation.trigger_type}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {delayType === 'immediate' ? 'Imediato' : `${automation.delay_value} ${DELAY_TYPE_LABELS[delayType]}`}
                            </Badge>
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              {automation.channel === 'email' ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                              {automation.channel === 'email' ? 'Email' : 'WhatsApp'}
                            </Badge>
                            {automation.template && (
                              <Badge variant="secondary" className="text-xs">📝 {automation.template.name}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(automation)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateAutomation(automation)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedAutomation(automation); setDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Switch checked={automation.is_active} onCheckedChange={() => toggleAutomation(automation.id)} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredAutomations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma automação encontrada</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenWizard} disabled={!canCreateMore}>
                    <Plus className="h-4 w-4 mr-2" /> Criar primeira automação
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ========== WIZARD DIALOG ========== */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Automação</DialogTitle>
            <div className="flex items-center gap-1 mt-2">
              {WIZARD_STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center">
                  <div className={`h-2 w-8 rounded-full transition-colors ${i <= wizardStep ? 'bg-primary' : 'bg-muted'}`} />
                  {i < WIZARD_STEPS.length - 1 && <div className="w-1" />}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Etapa {wizardStep + 1} de {WIZARD_STEPS.length}: {WIZARD_STEPS[wizardStep].label}
            </p>
          </DialogHeader>

          <div className="min-h-[200px]">
            {/* Step 1: Event */}
            {wizardStep === 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quando este evento acontecer:</Label>
                {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([key, label]) => {
                  const StepIcon = EVENT_ICONS[key];
                  return (
                    <div key={key} onClick={() => setForm(prev => ({ ...prev, trigger_type: key }))}
                      className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${form.trigger_type === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                      <StepIcon className="h-5 w-5" />
                      <span className="font-medium text-sm">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 2: Timing */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quando enviar a mensagem:</Label>
                {(Object.entries(DELAY_TYPE_LABELS) as [DelayType, string][]).map(([key, label]) => (
                  <div key={key} onClick={() => setForm(prev => ({ ...prev, delay_type: key, delay_value: key === 'immediate' ? 0 : prev.delay_value || 1 }))}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${form.delay_type === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                ))}
                {needsDelayValue && (
                  <div className="pt-2">
                    <Label>Valor</Label>
                    <Input type="number" min={1} value={form.delay_value || ''} onChange={(e) => setForm(prev => ({ ...prev, delay_value: Number(e.target.value) || 0 }))}
                      placeholder={form.delay_type.includes('hours') ? 'Ex: 24' : 'Ex: 2'} />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Channel */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Canal de envio:</Label>
                <div onClick={() => setForm(prev => ({ ...prev, channel: 'whatsapp' }))}
                  className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${form.channel === 'whatsapp' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-sm">WhatsApp</span>
                </div>
                <div onClick={() => setForm(prev => ({ ...prev, channel: 'email' }))}
                  className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${form.channel === 'email' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-sm">Email</span>
                </div>
              </div>
            )}

            {/* Step 4: Message / Template */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Template de mensagem:</Label>
                  <Select value={form.template_id || 'none'} onValueChange={(v) => setForm(prev => ({ ...prev, template_id: v === 'none' ? null : v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (criar depois)</SelectItem>
                      {templates.filter(t => t.is_active).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name} ({t.channel === 'whatsapp' ? 'WhatsApp' : t.channel})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTemplate && (
                  <div className="bg-muted/50 border rounded-xl p-4">
                    <p className="text-xs font-medium mb-1">Preview:</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedTemplate.content}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Variáveis disponíveis:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {DYNAMIC_FIELDS.map((field) => (
                      <Badge key={field.key} variant="outline" className="text-xs">{field.label}: {field.key}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Name & Activate */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>Nome da Automação *</Label>
                  <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`${EVENT_TYPE_LABELS[form.trigger_type]} - ${DELAY_TYPE_LABELS[form.delay_type]}`} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o que esta automação faz..." rows={2} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))} />
                  <Label>Ativar automação imediatamente</Label>
                </div>

                {/* Summary */}
                <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Resumo:</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>📌 Evento: <span className="text-foreground font-medium">{EVENT_TYPE_LABELS[form.trigger_type]}</span></p>
                    <p>⏱ Envio: <span className="text-foreground font-medium">{form.delay_type === 'immediate' ? 'Imediato' : `${form.delay_value} ${DELAY_TYPE_LABELS[form.delay_type]}`}</span></p>
                    <p>📨 Canal: <span className="text-foreground font-medium">{form.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}</span></p>
                    <p>📝 Template: <span className="text-foreground font-medium">{selectedTemplate?.name || 'Nenhum selecionado'}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {wizardStep > 0 && (
                <Button variant="outline" onClick={() => setWizardStep(s => s - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setWizardOpen(false)}>Cancelar</Button>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <Button onClick={() => setWizardStep(s => s + 1)}>
                  Próximo <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleWizardSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Criar Automação
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== EDIT DIALOG ========== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Evento</Label>
              <Select value={form.trigger_type} onValueChange={(v) => setForm(prev => ({ ...prev, trigger_type: v as EventType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quando enviar</Label>
                <Select value={form.delay_type} onValueChange={(v) => setForm(prev => ({ ...prev, delay_type: v as DelayType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DELAY_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsDelayValue && (
                <div>
                  <Label>Valor</Label>
                  <Input type="number" min={1} value={form.delay_value || ''} onChange={(e) => setForm(prev => ({ ...prev, delay_value: Number(e.target.value) || 0 }))} />
                </div>
              )}
            </div>
            <div>
              <Label>Canal</Label>
              <Select value={form.channel} onValueChange={(v) => setForm(prev => ({ ...prev, channel: v as AutomationChannel }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Template</Label>
              <Select value={form.template_id || 'none'} onValueChange={(v) => setForm(prev => ({ ...prev, template_id: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {templates.filter(t => t.is_active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))} />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DELETE DIALOG ========== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação?</AlertDialogTitle>
            <AlertDialogDescription>
              A automação "{selectedAutomation?.name}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
