import { useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTemplates, useFields, type Template, type TemplateType, type FieldInput, type FieldType } from '@/hooks/prontuario';

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
  { value: 'anamnese', label: 'Anamnese' },
  { value: 'vital_signs', label: 'Sinais Vitais' },
  { value: 'evolution', label: 'Evolução' },
  { value: 'diagnosis', label: 'Diagnóstico (CID)' },
  { value: 'exam_request', label: 'Solicitação de Exames' },
  { value: 'conduct', label: 'Plano/Conduta' },
  { value: 'procedure', label: 'Procedimento' },
  { value: 'prescription', label: 'Prescrição' },
];

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'select', label: 'Seleção' },
  { value: 'multiselect', label: 'Múltipla escolha' },
  { value: 'date', label: 'Data' },
  { value: 'file', label: 'Arquivo' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  template: Template | null;
}

export function TemplateDialog({ open, onClose, template }: Props) {
  const { create, update, saving: savingTemplate, fetchTemplates } = useTemplates();
  const { fields, fetchFields, clearFields, saveFields, saving: savingFields } = useFields();

  const [name, setName] = useState('');
  const [type, setType] = useState<TemplateType>('anamnese');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [localFields, setLocalFields] = useState<FieldInput[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const isEdit = !!template;
  const saving = savingTemplate || savingFields;

  useEffect(() => {
    if (open && template) {
      setName(template.name);
      setType(template.type);
      setDescription(template.description || '');
      setIsDefault(template.is_default);
      setIsActive(template.is_active);
      fetchFields(template.id);
    } else if (open) {
      setName('');
      setType('anamnese');
      setDescription('');
      setIsDefault(false);
      setIsActive(true);
      setLocalFields([]);
      clearFields();
    }
  }, [open, template]);

  useEffect(() => {
    if (fields.length > 0) {
      setLocalFields(fields.map(f => ({
        id: f.id,
        label: f.label,
        field_type: f.field_type,
        placeholder: f.placeholder || '',
        options: f.options,
        is_required: f.is_required,
        field_order: f.field_order,
      })));
    }
  }, [fields]);

  const handleClose = () => {
    onClose();
    clearFields();
  };

  const addField = () => {
    const order = localFields.length > 0 ? Math.max(...localFields.map(f => f.field_order)) + 1 : 1;
    setLocalFields([...localFields, { label: '', field_type: 'text', is_required: false, field_order: order }]);
  };

  const updateField = (idx: number, data: Partial<FieldInput>) => {
    setLocalFields(prev => prev.map((f, i) => i === idx ? { ...f, ...data } : f));
  };

  const removeField = (idx: number) => {
    setLocalFields(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newFields = [...localFields];
    const [dragged] = newFields.splice(dragIdx, 1);
    newFields.splice(idx, 0, dragged);
    setLocalFields(newFields.map((f, i) => ({ ...f, field_order: i + 1 })));
    setDragIdx(idx);
  };

  const handleDragEnd = () => setDragIdx(null);

  const handleSave = async () => {
    if (!name.trim()) return;

    let templateId = template?.id;

    if (isEdit && templateId) {
      await update(templateId, { name, type, description, is_default: isDefault, is_active: isActive });
    } else {
      templateId = await create({ name, type, description, scope: 'system', is_default: isDefault, is_active: isActive });
    }

    if (templateId && localFields.length > 0) {
      await saveFields(templateId, localFields);
    }

    await fetchTemplates();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Modelo' : 'Novo Modelo'}</DialogTitle>
          <DialogDescription>Configure as informações e campos do modelo</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do modelo" />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={v => setType(v as TemplateType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              <Label>Padrão</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Ativo</Label>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex justify-between mb-4">
              <Label className="text-base">Campos do Modelo</Label>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />Campo
              </Button>
            </div>

            {localFields.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                Nenhum campo. Clique em "Campo" para adicionar.
              </p>
            ) : (
              <div className="space-y-2">
                {localFields.map((f, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 border rounded-lg ${dragIdx === idx ? 'opacity-50 border-primary' : ''}`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <Input
                      value={f.label}
                      onChange={e => updateField(idx, { label: e.target.value })}
                      placeholder="Rótulo"
                      className="flex-1"
                    />
                    <Select value={f.field_type} onValueChange={v => updateField(idx, { field_type: v as FieldType })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={f.is_required} onCheckedChange={c => updateField(idx, { is_required: !!c })} />
                      <Label className="text-xs">Obrig.</Label>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeField(idx)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
