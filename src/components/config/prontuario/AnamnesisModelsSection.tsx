import { useState, useEffect } from 'react';
import {
  Plus, FileText, Copy, Edit, Star, Power, PowerOff, ChevronDown,
  AlertTriangle, Lock, ClipboardList, Stethoscope, Syringe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { useAnamnesisModels, type AnamnesisModel } from '@/hooks/prontuario/useAnamnesisModels';

interface Props {
  specialtyId?: string | null;
}

export function AnamnesisModelsSection({ specialtyId }: Props) {
  const { clinic } = useClinicData();
  const { models, loading, saving, createModel, updateModel, duplicateModel, setAsDefault, toggleActive } = useAnamnesisModels(specialtyId || null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AnamnesisModel | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formProcedureId, setFormProcedureId] = useState<string>('');
  const [procedures, setProcedures] = useState<{ id: string; name: string }[]>([]);

  // Load procedures for this clinic
  useEffect(() => {
    if (!clinic?.id) return;
    supabase
      .from('procedures')
      .select('id, name')
      .eq('clinic_id', clinic.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setProcedures(data || []));
  }, [clinic?.id]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormDesc('');
    setFormProcedureId('');
    setDialogOpen(true);
  };

  const openEdit = (m: AnamnesisModel) => {
    setEditing(m);
    setFormName(m.name);
    setFormDesc(m.description || '');
    setFormProcedureId(m.procedure_id || '');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    if (editing) {
      await updateModel(editing.id, {
        name: formName,
        description: formDesc,
        procedure_id: formProcedureId || null,
      });
    } else {
      await createModel({
        name: formName,
        description: formDesc,
        procedure_id: formProcedureId || null,
      });
    }
    setDialogOpen(false);
  };

  if (!specialtyId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Selecione uma especialidade para gerenciar modelos de anamnese.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Modelos de Anamnese
              </CardTitle>
              <CardDescription>
                Gerencie modelos de anamnese vinculados a esta especialidade ou procedimento específico.
                {models.length > 0 && (
                  <span className="ml-1 font-medium">{models.filter(m => m.is_active).length} ativo(s) de {models.length}</span>
                )}
              </CardDescription>
            </div>
            <Button onClick={openCreate} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />Novo Modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-1">Nenhum modelo de anamnese encontrado.</p>
              <p className="text-sm text-muted-foreground">Crie um modelo ou ative a especialidade para gerar automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {models.map(m => (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    !m.is_active ? 'opacity-60 bg-muted/30' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="p-2 rounded-md bg-primary/10 shrink-0">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-medium truncate">{m.name}</span>
                      {m.is_default && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />Padrão
                        </Badge>
                      )}
                      {m.is_system && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />Sistema
                        </Badge>
                      )}
                      {!m.is_active && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {m.description && <span className="truncate max-w-[200px]">{m.description}</span>}
                      {m.procedure_name ? (
                        <Badge variant="outline" className="text-xs">
                          <Syringe className="h-3 w-3 mr-1" />{m.procedure_name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Stethoscope className="h-3 w-3 mr-1" />Especialidade inteira
                        </Badge>
                      )}
                      {m.usage_count > 0 && (
                        <span>{m.usage_count} uso(s)</span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">Ações<ChevronDown className="h-4 w-4 ml-1" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(m)}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateModel(m.id)} disabled={saving}>
                        <Copy className="h-4 w-4 mr-2" />Duplicar
                      </DropdownMenuItem>
                      {!m.is_default && (
                        <DropdownMenuItem onClick={() => setAsDefault(m.id)} disabled={saving}>
                          <Star className="h-4 w-4 mr-2" />Definir como Padrão
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleActive(m.id, !m.is_active)} disabled={saving}>
                        {m.is_active ? (
                          <><PowerOff className="h-4 w-4 mr-2" />Desativar</>
                        ) : (
                          <><Power className="h-4 w-4 mr-2" />Ativar</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {/* Resolution info */}
              <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
                <strong>Resolução:</strong> Se existir modelo vinculado ao procedimento → será usado. Caso contrário → modelo padrão da especialidade.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Modelo' : 'Novo Modelo de Anamnese'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Altere as propriedades do modelo.' : 'Defina o nome e vínculo do novo modelo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Anamnese Completa" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Descrição opcional" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Vínculo</Label>
              <Select value={formProcedureId || '_specialty'} onValueChange={v => setFormProcedureId(v === '_specialty' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Especialidade inteira" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_specialty">
                    <span className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />Especialidade inteira (padrão)
                    </span>
                  </SelectItem>
                  {procedures.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <Syringe className="h-4 w-4" />{p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Modelos vinculados a procedimentos específicos terão prioridade sobre o modelo padrão da especialidade.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !formName.trim()}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
