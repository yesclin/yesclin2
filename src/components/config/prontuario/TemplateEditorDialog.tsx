import { useState, useEffect, useCallback } from 'react';
import {
  Plus, GripVertical, Trash2, Save, Copy, ChevronDown, ChevronUp,
  Settings2, Eye, EyeOff, HelpCircle, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  type ModeloProntuario,
  type EstruturaModelo,
  type SecaoModelo,
  type CampoModelo,
  type CampoTipo,
  createEmptyCampo,
  createEmptySecao,
} from '@/hooks/prontuario/useModelosProntuario';

// ─── Constants ──────────────────────────────────────────
const CAMPO_TIPOS: { value: CampoTipo; label: string }[] = [
  { value: 'texto_curto', label: 'Texto curto' },
  { value: 'texto_longo', label: 'Texto longo' },
  { value: 'numerico', label: 'Numérico' },
  { value: 'data', label: 'Data' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Lista suspensa' },
  { value: 'multiselect', label: 'Múltipla escolha' },
  { value: 'automatico', label: 'Automático' },
  { value: 'calculado', label: 'Calculado' },
];

const CAMPOS_AUTOMATICOS = [
  { value: 'idade_paciente', label: 'Idade do paciente' },
  { value: 'nome_paciente', label: 'Nome do paciente' },
  { value: 'data_atual', label: 'Data atual' },
  { value: 'profissional', label: 'Nome do profissional' },
];

// ─── Props ──────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  modelo: ModeloProntuario | null;
  onSave: (id: string, estrutura: EstruturaModelo) => Promise<boolean>;
  saving: boolean;
}

// ─── Field Config Panel ─────────────────────────────────
function CampoConfigPanel({
  campo,
  onChange,
  onRemove,
  onDuplicate,
}: {
  campo: CampoModelo;
  onChange: (c: CampoModelo) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const [configOpen, setConfigOpen] = useState(false);
  const needsOptions = campo.tipo === 'select' || campo.tipo === 'multiselect';

  return (
    <div className="border rounded-lg bg-card">
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move flex-shrink-0" />
        <Input
          value={campo.label}
          onChange={e => onChange({ ...campo, label: e.target.value })}
          placeholder="Nome do campo"
          className="flex-1"
        />
        <Select value={campo.tipo} onValueChange={v => onChange({ ...campo, tipo: v as CampoTipo })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAMPO_TIPOS.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Switch
            checked={campo.obrigatorio}
            onCheckedChange={v => onChange({ ...campo, obrigatorio: v })}
          />
          <span className="text-xs text-muted-foreground">Obrig.</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfigOpen(!configOpen)}
          className="h-8 w-8"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDuplicate} className="h-8 w-8">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {configOpen && (
        <div className="px-3 pb-3 pt-1 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={campo.placeholder}
                onChange={e => onChange({ ...campo, placeholder: e.target.value })}
                placeholder="Texto de exemplo"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor padrão</Label>
              <Input
                value={campo.valor_padrao}
                onChange={e => onChange({ ...campo, valor_padrao: e.target.value })}
                placeholder="Valor inicial"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Ajuda / Descrição
            </Label>
            <Input
              value={campo.ajuda}
              onChange={e => onChange({ ...campo, ajuda: e.target.value })}
              placeholder="Texto de ajuda para o usuário"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {campo.visivel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <Switch
                checked={campo.visivel}
                onCheckedChange={v => onChange({ ...campo, visivel: v })}
              />
              <span className="text-xs">Visível</span>
            </div>
          </div>

          {needsOptions && (
            <div className="space-y-1">
              <Label className="text-xs">Opções (uma por linha)</Label>
              <Textarea
                value={(campo.opcoes || []).join('\n')}
                onChange={e =>
                  onChange({ ...campo, opcoes: e.target.value.split('\n').filter(Boolean) })
                }
                rows={3}
                placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                className="text-sm"
              />
            </div>
          )}

          {campo.tipo === 'automatico' && (
            <div className="space-y-1">
              <Label className="text-xs">Campo automático</Label>
              <Select
                value={campo.campo_automatico}
                onValueChange={v => onChange({ ...campo, campo_automatico: v })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPOS_AUTOMATICOS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {campo.tipo === 'calculado' && (
            <div className="space-y-1">
              <Label className="text-xs">Fórmula (ex: peso / (altura * altura))</Label>
              <Input
                value={campo.formula}
                onChange={e => onChange({ ...campo, formula: e.target.value })}
                placeholder="peso / (altura * altura)"
                className="h-8 text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section Panel ──────────────────────────────────────
function SecaoPanel({
  secao,
  onChange,
  onRemove,
}: {
  secao: SecaoModelo;
  onChange: (s: SecaoModelo) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const addCampo = () => {
    const ordem = secao.campos.length > 0
      ? Math.max(...secao.campos.map(c => c.ordem)) + 1
      : 1;
    onChange({ ...secao, campos: [...secao.campos, createEmptyCampo(ordem)] });
  };

  const updateCampo = (idx: number, campo: CampoModelo) => {
    const campos = [...secao.campos];
    campos[idx] = campo;
    onChange({ ...secao, campos });
  };

  const removeCampo = (idx: number) => {
    onChange({ ...secao, campos: secao.campos.filter((_, i) => i !== idx) });
  };

  const duplicateCampo = (idx: number) => {
    const original = secao.campos[idx];
    const newCampo: CampoModelo = {
      ...original,
      id: crypto.randomUUID(),
      label: `${original.label} (cópia)`,
      ordem: secao.campos.length + 1,
    };
    onChange({ ...secao, campos: [...secao.campos, newCampo] });
  };

  // Simple drag reorder within section
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const campos = [...secao.campos];
    const [dragged] = campos.splice(dragIdx, 1);
    campos.splice(idx, 0, dragged);
    onChange({ ...secao, campos: campos.map((c, i) => ({ ...c, ordem: i + 1 })) });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="border rounded-lg">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="flex items-center gap-2 p-3 bg-muted/30">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <Layers className="h-4 w-4 text-primary" />
          <Input
            value={secao.titulo}
            onChange={e => onChange({ ...secao, titulo: e.target.value })}
            placeholder="Nome da seção"
            className="flex-1 h-8 font-medium"
          />
          <Badge variant="secondary" className="text-xs">
            {secao.campos.length} campos
          </Badge>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <CollapsibleContent>
          <div className="p-3 space-y-2">
            {secao.campos.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
                Nenhum campo. Clique em "Adicionar campo" para começar.
              </p>
            ) : (
              secao.campos.map((campo, idx) => (
                <div
                  key={campo.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={dragIdx === idx ? 'opacity-50' : ''}
                >
                  <CampoConfigPanel
                    campo={campo}
                    onChange={c => updateCampo(idx, c)}
                    onRemove={() => removeCampo(idx)}
                    onDuplicate={() => duplicateCampo(idx)}
                  />
                </div>
              ))
            )}
            <Button variant="outline" size="sm" onClick={addCampo} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Adicionar campo
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─── Main Editor Dialog ─────────────────────────────────
export function TemplateEditorDialog({ open, onClose, modelo, onSave, saving }: Props) {
  const [estrutura, setEstrutura] = useState<EstruturaModelo>({ sections: [] });
  const [nome, setNome] = useState('');
  const isSystem = modelo?.is_sistema ?? false;

  useEffect(() => {
    if (open && modelo) {
      setNome(modelo.nome);
      setEstrutura(
        modelo.estrutura_json?.sections?.length
          ? modelo.estrutura_json
          : { sections: [createEmptySecao(1)] }
      );
    } else if (open) {
      setNome('');
      setEstrutura({ sections: [createEmptySecao(1)] });
    }
  }, [open, modelo]);

  const addSecao = () => {
    const ordem = estrutura.sections.length > 0
      ? Math.max(...estrutura.sections.map(s => s.ordem)) + 1
      : 1;
    setEstrutura({ sections: [...estrutura.sections, createEmptySecao(ordem)] });
  };

  const updateSecao = (idx: number, secao: SecaoModelo) => {
    const sections = [...estrutura.sections];
    sections[idx] = secao;
    setEstrutura({ sections });
  };

  const removeSecao = (idx: number) => {
    setEstrutura({ sections: estrutura.sections.filter((_, i) => i !== idx) });
  };

  // Section drag reorder
  const [dragSecIdx, setDragSecIdx] = useState<number | null>(null);
  const handleSecDragStart = (idx: number) => setDragSecIdx(idx);
  const handleSecDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragSecIdx === null || dragSecIdx === idx) return;
    const sections = [...estrutura.sections];
    const [dragged] = sections.splice(dragSecIdx, 1);
    sections.splice(idx, 0, dragged);
    setEstrutura({ sections: sections.map((s, i) => ({ ...s, ordem: i + 1 })) });
    setDragSecIdx(idx);
  };
  const handleSecDragEnd = () => setDragSecIdx(null);

  const handleSave = async () => {
    if (!modelo) return;
    await onSave(modelo.id, estrutura);
  };

  const totalCampos = estrutura.sections.reduce((sum, s) => sum + s.campos.length, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Editor de Modelo de Prontuário
          </DialogTitle>
          <DialogDescription>
            {isSystem
              ? 'Modelo do sistema — somente leitura. Duplique para personalizar.'
              : 'Configure seções e campos do modelo. Arrastar para reorganizar.'}
          </DialogDescription>
        </DialogHeader>

        {isSystem && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
            ⚠️ Este é um modelo padrão do sistema e não pode ser editado. Duplique-o para criar uma versão personalizada.
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <Label>Nome do modelo</Label>
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome do modelo"
                disabled={isSystem}
              />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {estrutura.sections.length} seções · {totalCampos} campos
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            {estrutura.sections.map((secao, idx) => (
              <div
                key={secao.id}
                draggable={!isSystem}
                onDragStart={() => handleSecDragStart(idx)}
                onDragOver={e => handleSecDragOver(e, idx)}
                onDragEnd={handleSecDragEnd}
                className={dragSecIdx === idx ? 'opacity-50' : ''}
              >
                <SecaoPanel
                  secao={secao}
                  onChange={s => updateSecao(idx, s)}
                  onRemove={() => removeSecao(idx)}
                />
              </div>
            ))}

            {!isSystem && (
              <Button variant="outline" onClick={addSecao} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Adicionar seção
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {!isSystem && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar modelo'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
