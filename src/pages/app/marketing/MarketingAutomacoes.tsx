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
  Plus, Search, Edit2, Copy, Trash2, Loader2, Settings2,
  CalendarPlus, Bell, CheckCircle, RotateCcw, Clock,
  Package, AlertTriangle, XCircle, UserX, Cake, UserMinus, Zap,
} from "lucide-react";
import {
  TRIGGER_TYPE_LABELS,
  type TriggerType,
} from "@/types/comunicacao";
import { useAutomationRules, type AutomationFormData, type AutomationRuleRow } from "@/hooks/useAutomationRules";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";

const TRIGGER_ICONS: Record<TriggerType, React.ElementType> = {
  appointment_created: CalendarPlus,
  appointment_reminder: Bell,
  appointment_finished: CheckCircle,
  return_reminder: RotateCcw,
  return_expiring: Clock,
  package_80_percent: Package,
  package_expiring: AlertTriangle,
  package_expired: XCircle,
  patient_missed: UserX,
  patient_birthday: Cake,
  patient_inactive: UserMinus,
};

// Which triggers need which config field
const TRIGGER_CONFIG_FIELDS: Record<string, 'hours_before' | 'days_after' | 'days_inactive' | null> = {
  appointment_created: null,
  appointment_reminder: 'hours_before',
  appointment_finished: null,
  return_reminder: 'days_after',
  return_expiring: 'days_after',
  package_80_percent: null,
  package_expiring: 'days_after',
  package_expired: 'days_after',
  patient_missed: null,
  patient_birthday: null,
  patient_inactive: 'days_inactive',
};

const CONFIG_FIELD_LABELS: Record<string, string> = {
  hours_before: 'Horas antes',
  days_after: 'Dias depois',
  days_inactive: 'Dias de inatividade',
};

const emptyForm: AutomationFormData = {
  name: '',
  description: '',
  trigger_type: 'appointment_created',
  trigger_config: {},
  template_id: null,
  is_active: true,
  priority: 0,
};

export default function MarketingAutomacoes() {
  const {
    automations, loading, saving,
    createAutomation, updateAutomation, deleteAutomation,
    toggleAutomation, duplicateAutomation,
  } = useAutomationRules();
  const { templates } = useMessageTemplates();

  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRuleRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AutomationFormData>(emptyForm);

  const activeCount = automations.filter((a) => a.is_active).length;

  const filteredAutomations = automations.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    TRIGGER_TYPE_LABELS[a.trigger_type as TriggerType]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, priority: automations.length + 1 });
    setFormOpen(true);
  };

  const handleOpenEdit = (automation: AutomationRuleRow) => {
    setEditingId(automation.id);
    const config = (automation.trigger_config || {}) as Record<string, any>;
    setForm({
      name: automation.name,
      description: automation.description || '',
      trigger_type: automation.trigger_type as TriggerType,
      trigger_config: {
        hours_before: config.hours_before,
        days_after: config.days_after,
        days_inactive: config.days_inactive,
      },
      template_id: automation.template_id,
      is_active: automation.is_active,
      priority: automation.priority,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    // Clean config: only keep relevant field
    const configField = TRIGGER_CONFIG_FIELDS[form.trigger_type];
    const cleanConfig: Record<string, number> = {};
    if (configField && (form.trigger_config as any)[configField]) {
      cleanConfig[configField] = Number((form.trigger_config as any)[configField]);
    }

    const payload = { ...form, trigger_config: cleanConfig };

    if (editingId) {
      await updateAutomation(editingId, payload);
    } else {
      await createAutomation(payload);
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedAutomation) return;
    await deleteAutomation(selectedAutomation.id);
    setDeleteOpen(false);
    setSelectedAutomation(null);
  };

  const configField = TRIGGER_CONFIG_FIELDS[form.trigger_type];

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
                {activeCount} de {automations.length} ativas
              </p>
            </div>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar automações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredAutomations.map((automation) => {
                const triggerType = automation.trigger_type as TriggerType;
                const Icon = TRIGGER_ICONS[triggerType] || Zap;
                const config = (automation.trigger_config || {}) as Record<string, any>;

                return (
                  <div
                    key={automation.id}
                    className={`p-4 border rounded-lg transition-all ${
                      automation.is_active ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          automation.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{automation.name}</h4>
                          {automation.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{automation.description}</p>
                          )}

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {TRIGGER_TYPE_LABELS[triggerType] || automation.trigger_type}
                            </Badge>

                            {config.hours_before && (
                              <Badge variant="secondary" className="text-xs">{config.hours_before}h antes</Badge>
                            )}
                            {config.days_after && (
                              <Badge variant="secondary" className="text-xs">{config.days_after} dias depois</Badge>
                            )}
                            {config.days_inactive && (
                              <Badge variant="secondary" className="text-xs">{config.days_inactive} dias inativo</Badge>
                            )}

                            {automation.template && (
                              <Badge variant="secondary" className="text-xs">
                                📝 {automation.template.name}
                              </Badge>
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
                        <Switch
                          checked={automation.is_active}
                          onCheckedChange={() => toggleAutomation(automation.id)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredAutomations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma automação encontrada</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira automação
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Automação' : 'Nova Automação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Lembrete 24h antes"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que esta automação faz..."
                rows={2}
              />
            </div>

            <div>
              <Label>Gatilho *</Label>
              <Select
                value={form.trigger_type}
                onValueChange={(v) => setForm(prev => ({ ...prev, trigger_type: v as TriggerType, trigger_config: {} }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {configField && (
              <div>
                <Label>{CONFIG_FIELD_LABELS[configField]}</Label>
                <Input
                  type="number"
                  min={1}
                  value={(form.trigger_config as any)[configField] || ''}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    trigger_config: { ...prev.trigger_config, [configField]: e.target.value ? Number(e.target.value) : undefined },
                  }))}
                  placeholder={configField === 'hours_before' ? 'Ex: 24' : 'Ex: 30'}
                />
              </div>
            )}

            <div>
              <Label>Template de Mensagem</Label>
              <Select
                value={form.template_id || 'none'}
                onValueChange={(v) => setForm(prev => ({ ...prev, template_id: v === 'none' ? null : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {templates.filter(t => t.is_active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Input
                type="number"
                min={1}
                value={form.priority}
                onChange={(e) => setForm(prev => ({ ...prev, priority: Number(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Menor número = maior prioridade na execução
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))}
              />
              <Label>Ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação?</AlertDialogTitle>
            <AlertDialogDescription>
              A automação "{selectedAutomation?.name}" será excluída permanentemente. Esta ação não pode ser desfeita.
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
