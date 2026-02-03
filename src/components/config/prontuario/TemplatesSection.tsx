import { useState } from 'react';
import { Plus, FileText, Copy, Trash2, Edit, Star, Power, PowerOff, ChevronDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTemplates, type Template, type TemplateType } from '@/hooks/prontuario';
import { TemplateDialog } from './TemplateDialog';

const TYPES: { value: TemplateType; label: string }[] = [
  { value: 'anamnese', label: 'Anamnese' },
  { value: 'vital_signs', label: 'Sinais Vitais' },
  { value: 'evolution', label: 'Evolução' },
  { value: 'diagnosis', label: 'Diagnóstico (CID)' },
  { value: 'exam_request', label: 'Solicitação de Exames' },
  { value: 'conduct', label: 'Plano/Conduta' },
  { value: 'procedure', label: 'Procedimento' },
  { value: 'prescription', label: 'Prescrição' },
  { value: 'odontogram', label: 'Odontograma' },
  { value: 'tooth_procedure', label: 'Procedimento por Dente' },
  { value: 'dental_session', label: 'Sessão Odontológica' },
];

const TYPE_COLORS: Record<TemplateType, string> = {
  anamnese: 'bg-blue-100 text-blue-800',
  vital_signs: 'bg-red-100 text-red-800',
  evolution: 'bg-green-100 text-green-800',
  diagnosis: 'bg-purple-100 text-purple-800',
  exam_request: 'bg-cyan-100 text-cyan-800',
  conduct: 'bg-amber-100 text-amber-800',
  procedure: 'bg-orange-100 text-orange-800',
  prescription: 'bg-pink-100 text-pink-800',
  odontogram: 'bg-teal-100 text-teal-800',
  tooth_procedure: 'bg-indigo-100 text-indigo-800',
  dental_session: 'bg-emerald-100 text-emerald-800',
};

export function TemplatesSection() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Template | null>(null);

  const { templates, loading, saving, remove, duplicate, toggleActive } = useTemplates(
    typeFilter !== 'all' ? (typeFilter as TemplateType) : undefined
  );

  const handleEdit = (t: Template) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (toDelete) {
      await remove(toDelete.id);
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
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
                <FileText className="h-5 w-5" />
                Modelos de Prontuário
              </CardTitle>
              <CardDescription>Crie modelos de anamnese, evolução e outros</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />Novo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum modelo encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(t => (
                <div
                  key={t.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    !t.is_active ? 'opacity-60 bg-muted/30' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{t.name}</span>
                      <Badge className={TYPE_COLORS[t.type]}>{TYPES.find(x => x.value === t.type)?.label}</Badge>
                      {t.is_default && <Badge variant="outline"><Star className="h-3 w-3 mr-1" />Padrão</Badge>}
                      {!t.is_active && <Badge variant="destructive">Inativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{t.fields_count || 0} campos</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">Ações<ChevronDown className="h-4 w-4 ml-2" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(t)}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(t.id)} disabled={saving}>
                        <Copy className="h-4 w-4 mr-2" />Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleActive(t.id, !t.is_active)} disabled={saving}>
                        {t.is_active ? <><PowerOff className="h-4 w-4 mr-2" />Desativar</> : <><Power className="h-4 w-4 mr-2" />Ativar</>}
                      </DropdownMenuItem>
                      {!t.is_system && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setToDelete(t); setDeleteOpen(true); }} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TemplateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} template={editing} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{toDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
