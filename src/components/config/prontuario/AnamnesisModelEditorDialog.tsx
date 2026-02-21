/**
 * AnamnesisModelEditorDialog — Editor completo de estrutura de modelo de anamnese
 * 
 * Permite: editar nome/descrição, adicionar/remover/reordenar/duplicar seções e campos,
 * marcar campos obrigatórios, e salva com versionamento automático.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus, Trash2, ArrowUp, ArrowDown, Save,
  Edit3, ChevronDown, ChevronRight, Copy, GripVertical,
  FileText, Type, AlignLeft, Hash, Calendar, List, CheckSquare, ToggleLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AnamnesisModel } from '@/hooks/prontuario/useAnamnesisModels';
import type { Json } from '@/integrations/supabase/types';
import { getDefaultAnamnesisStructure } from '@/constants/defaultAnamnesisStructures';

// ===== TYPES =====

interface EditorField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

interface EditorSection {
  id: string;
  type: 'section';
  title: string;
  fields: EditorField[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto curto', icon: Type },
  { value: 'textarea', label: 'Texto longo', icon: AlignLeft },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'date', label: 'Data', icon: Calendar },
  { value: 'select', label: 'Seleção única', icon: List },
  { value: 'multiselect', label: 'Seleção múltipla', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'radio', label: 'Opções (radio)', icon: ToggleLeft },
];

const getFieldIcon = (type: string) => {
  const found = FIELD_TYPES.find(f => f.value === type);
  return found?.icon || FileText;
};

interface AnamnesisModelEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: AnamnesisModel | null;
  onSave: (id: string, data: { name?: string; description?: string; campos?: Json }) => Promise<boolean>;
  saving: boolean;
  specialtySlug?: string;
}

export function AnamnesisModelEditorDialog({
  open,
  onOpenChange,
  model,
  onSave,
  saving,
  specialtySlug,
}: AnamnesisModelEditorDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Load model data and structure from version
  useEffect(() => {
    if (!open || !model) return;

    setName(model.name);
    setDescription(model.description || '');
    setHasChanges(false);
    setEditingSectionId(null);

    const loadStructure = async () => {
      setLoadingStructure(true);
      try {
        let structure: any[] = [];

        if (model.current_version_id) {
          const { data } = await supabase
            .from('anamnesis_template_versions')
            .select('structure')
            .eq('id', model.current_version_id)
            .single();
          if (data?.structure && Array.isArray(data.structure)) {
            structure = data.structure as any[];
          }
        }

        if (structure.length === 0 && model.campos && Array.isArray(model.campos)) {
          structure = model.campos as any[];
        }

        if (structure.length === 0 && specialtySlug) {
          const defaultStructure = getDefaultAnamnesisStructure(specialtySlug);
          if (defaultStructure.length > 0) {
            structure = defaultStructure;
          }
        }

        const parsed: EditorSection[] = structure.map((s: any, idx: number) => ({
          id: s.id || `section_${idx}`,
          type: 'section',
          title: s.title || `Seção ${idx + 1}`,
          fields: (s.fields || []).map((f: any, fIdx: number) => ({
            id: f.id || `field_${idx}_${fIdx}`,
            type: f.type || 'text',
            label: f.label || '',
            required: f.required || false,
            placeholder: f.placeholder || '',
            options: f.options || [],
            description: f.description || '',
          })),
        }));

        setSections(parsed);
        // All sections collapsed by default
        const initialOpen: Record<string, boolean> = {};
        parsed.forEach(s => { initialOpen[s.id] = false; });
        setOpenSections(initialOpen);
      } catch (err) {
        console.error('Error loading template structure:', err);
      } finally {
        setLoadingStructure(false);
      }
    };

    loadStructure();
  }, [open, model]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Section operations
  const addSection = () => {
    const newId = `section_${Date.now()}`;
    setSections(prev => [...prev, { id: newId, type: 'section', title: 'Nova Seção', fields: [] }]);
    setOpenSections(prev => ({ ...prev, [newId]: true }));
    setEditingSectionId(newId);
    markChanged();
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
    markChanged();
  };

  const duplicateSection = (idx: number) => {
    const original = sections[idx];
    const newId = `section_${Date.now()}`;
    const duplicated: EditorSection = {
      ...original,
      id: newId,
      title: `${original.title} (cópia)`,
      fields: original.fields.map(f => ({ ...f, id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })),
    };
    setSections(prev => {
      const arr = [...prev];
      arr.splice(idx + 1, 0, duplicated);
      return arr;
    });
    setOpenSections(prev => ({ ...prev, [newId]: true }));
    markChanged();
  };

  const moveSectionUp = (idx: number) => {
    if (idx === 0) return;
    setSections(prev => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
    markChanged();
  };

  const moveSectionDown = (idx: number) => {
    setSections(prev => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
    markChanged();
  };

  const updateSectionTitle = (idx: number, title: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, title } : s));
    markChanged();
  };

  // Field operations
  const addField = (sectionIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      return {
        ...s,
        fields: [...s.fields, {
          id: `field_${Date.now()}`,
          type: 'textarea',
          label: '',
          required: false,
          placeholder: '',
          options: [],
          description: '',
        }],
      };
    }));
    markChanged();
  };

  const updateField = (sectionIdx: number, fieldIdx: number, updates: Partial<EditorField>) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      return {
        ...s,
        fields: s.fields.map((f, fi) => fi === fieldIdx ? { ...f, ...updates } : f),
      };
    }));
    markChanged();
  };

  const removeField = (sectionIdx: number, fieldIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      return { ...s, fields: s.fields.filter((_, fi) => fi !== fieldIdx) };
    }));
    markChanged();
  };

  const duplicateField = (sectionIdx: number, fieldIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      const original = s.fields[fieldIdx];
      const dup = { ...original, id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, label: `${original.label} (cópia)` };
      const fields = [...s.fields];
      fields.splice(fieldIdx + 1, 0, dup);
      return { ...s, fields };
    }));
    markChanged();
  };

  const moveFieldUp = (sectionIdx: number, fieldIdx: number) => {
    if (fieldIdx === 0) return;
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      const fields = [...s.fields];
      [fields[fieldIdx - 1], fields[fieldIdx]] = [fields[fieldIdx], fields[fieldIdx - 1]];
      return { ...s, fields };
    }));
    markChanged();
  };

  const moveFieldDown = (sectionIdx: number, fieldIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      if (fieldIdx >= s.fields.length - 1) return s;
      const fields = [...s.fields];
      [fields[fieldIdx], fields[fieldIdx + 1]] = [fields[fieldIdx + 1], fields[fieldIdx]];
      return { ...s, fields };
    }));
    markChanged();
  };

  // Save
  const handleSave = async () => {
    if (!model) return;

    const structure = sections.map(s => ({
      id: s.id,
      type: 'section',
      title: s.title,
      fields: s.fields.map(f => ({
        id: f.id,
        type: f.type,
        label: f.label,
        required: f.required,
        ...(f.placeholder ? { placeholder: f.placeholder } : {}),
        ...(f.options && f.options.length > 0 ? { options: f.options } : {}),
        ...(f.description ? { description: f.description } : {}),
      })),
    }));

    const success = await onSave(model.id, {
      name: name.trim(),
      description: description.trim(),
      campos: structure as Json,
    });

    if (success) {
      setHasChanges(false);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setConfirmClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const totalFields = sections.reduce((acc, s) => acc + s.fields.length, 0);
  const requiredFields = sections.reduce((acc, s) => acc + s.fields.filter(f => f.required).length, 0);

  return (
    <TooltipProvider delayDuration={300}>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b bg-muted/30">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Edit3 className="h-4 w-4 text-primary" />
                </div>
                Editor de Modelo
                {model?.is_default && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Padrão</Badge>
                )}
                {model?.current_version_number && (
                  <Badge variant="secondary" className="text-xs font-mono">v{model.current_version_number}</Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Edite a estrutura do modelo. Ao salvar, uma nova versão será criada automaticamente.
              </DialogDescription>
            </DialogHeader>

            {/* Name & Description inline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Nome do Modelo</Label>
                <Input
                  value={name}
                  onChange={e => { setName(e.target.value); markChanged(); }}
                  placeholder="Nome do modelo"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Descrição</Label>
                <Input
                  value={description}
                  onChange={e => { setDescription(e.target.value); markChanged(); }}
                  placeholder="Descrição opcional"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-6 py-2.5 flex items-center gap-3 border-b bg-background">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <strong className="text-foreground">{sections.length}</strong> seção(ões)
              </span>
              <span className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <strong className="text-foreground">{totalFields}</strong> campo(s)
              </span>
              <span className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <strong className="text-foreground">{requiredFields}</strong> obrigatório(s)
              </span>
            </div>
            {hasChanges && (
              <Badge variant="destructive" className="text-[10px] ml-auto animate-pulse">
                Alterações não salvas
              </Badge>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 max-h-[calc(95vh-320px)]">
            <div className="p-6 space-y-2">
              {loadingStructure ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  {sections.map((section, sIdx) => {
                    const isOpen = openSections[section.id] || false;
                    const isEditing = editingSectionId === section.id;
                    const FieldIcon = getFieldIcon('text');

                    return (
                      <div
                        key={section.id}
                        className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                          isOpen ? 'shadow-sm border-primary/20' : 'hover:border-muted-foreground/30'
                        }`}
                      >
                        {/* Section Header */}
                        <div
                          className={`flex items-center gap-2 px-4 py-3 cursor-pointer select-none transition-colors ${
                            isOpen ? 'bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => toggleSection(section.id)}
                        >
                          {/* Reorder */}
                          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={() => moveSectionUp(sIdx)}
                                  disabled={sIdx === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Mover para cima</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={() => moveSectionDown(sIdx)}
                                  disabled={sIdx === sections.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Mover para baixo</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Section number */}
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {sIdx + 1}
                          </div>

                          {/* Title */}
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={section.title}
                              onChange={e => updateSectionTitle(sIdx, e.target.value)}
                              onBlur={() => setEditingSectionId(null)}
                              onKeyDown={e => { if (e.key === 'Enter') setEditingSectionId(null); }}
                              onClick={e => e.stopPropagation()}
                              className="h-7 text-sm font-semibold max-w-[300px]"
                            />
                          ) : (
                            <span
                              className="font-semibold text-sm truncate flex-1 cursor-text"
                              onDoubleClick={e => { e.stopPropagation(); setEditingSectionId(section.id); }}
                            >
                              {section.title}
                            </span>
                          )}

                          {/* Right side actions */}
                          <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Badge variant="secondary" className="text-[10px] px-2 h-5 font-normal">
                              {section.fields.length} campo(s)
                            </Badge>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => duplicateSection(sIdx)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Duplicar seção</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive/60 hover:text-destructive"
                                  onClick={() => removeSection(sIdx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Excluir seção</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Expand indicator */}
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>

                        {/* Section Content (fields) */}
                        {isOpen && (
                          <div className="border-t bg-muted/20 p-4 space-y-2">
                            {section.fields.length === 0 ? (
                              <div className="text-center py-6 text-muted-foreground text-sm">
                                Nenhum campo nesta seção. Clique abaixo para adicionar.
                              </div>
                            ) : (
                              section.fields.map((field, fIdx) => {
                                const IconComp = getFieldIcon(field.type);
                                return (
                                  <div
                                    key={field.id}
                                    className="group flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-background hover:shadow-sm transition-all"
                                  >
                                    {/* Drag handle visual */}
                                    <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

                                    {/* Reorder */}
                                    <div className="flex flex-col gap-0">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => moveFieldUp(sIdx, fIdx)}
                                        disabled={fIdx === 0}
                                      >
                                        <ArrowUp className="h-2.5 w-2.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => moveFieldDown(sIdx, fIdx)}
                                        disabled={fIdx === section.fields.length - 1}
                                      >
                                        <ArrowDown className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>

                                    {/* Field type icon */}
                                    <div className="h-7 w-7 rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                                      <IconComp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>

                                    {/* Field name */}
                                    <Input
                                      value={field.label}
                                      onChange={e => updateField(sIdx, fIdx, { label: e.target.value })}
                                      placeholder="Nome do campo"
                                      className="h-8 text-sm flex-1 min-w-0 max-w-[240px]"
                                    />

                                    {/* Field type selector */}
                                    <Select
                                      value={field.type}
                                      onValueChange={v => updateField(sIdx, fIdx, { type: v })}
                                    >
                                      <SelectTrigger className="h-8 text-xs w-[140px] shrink-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {FIELD_TYPES.map(ft => (
                                          <SelectItem key={ft.value} value={ft.value}>
                                            <span className="flex items-center gap-2">
                                              <ft.icon className="h-3 w-3" />
                                              {ft.label}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    {/* Required toggle */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Switch
                                        checked={field.required}
                                        onCheckedChange={v => updateField(sIdx, fIdx, { required: v })}
                                        className="scale-75"
                                      />
                                      <span className={`text-[10px] font-medium ${field.required ? 'text-orange-600' : 'text-muted-foreground/50'}`}>
                                        Obrig.
                                      </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                            onClick={() => duplicateField(sIdx, fIdx)}
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">Duplicar</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive/60 hover:text-destructive"
                                            onClick={() => removeField(sIdx, fIdx)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">Excluir</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                );
                              })
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs text-muted-foreground hover:text-primary border border-dashed hover:border-primary/30 mt-2"
                              onClick={() => addField(sIdx)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar campo
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add section */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary/30 mt-4"
                    onClick={addSection}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Seção
                  </Button>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Ao salvar, uma nova versão (v{(model?.current_version_number || 0) + 1}) será criada automaticamente.
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !hasChanges || !name.trim()}
                className="gap-2"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Salvando...' : 'Salvar e Versionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm discard */}
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja descartá-las?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmClose(false); onOpenChange(false); }}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
