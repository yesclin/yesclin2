import { useState } from 'react';
import {
  Plus, Layers, Copy, Trash2, Edit, Star, Power, PowerOff,
  ChevronDown, StarOff, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { useModelosProntuario, type ModeloProntuario } from '@/hooks/prontuario/useModelosProntuario';
import { TemplateEditorDialog } from './TemplateEditorDialog';

export function ModelosProntuarioSection() {
  const {
    modelos, loading, saving, create, updateEstrutura, updateInfo, duplicate, remove,
  } = useModelosProntuario();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ModeloProntuario | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ModeloProntuario | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await create(newName.trim());
    setCreateOpen(false);
    setNewName('');
    if (id) {
      const modelo = modelos.find(m => m.id === id);
      // refetch will happen, open editor after
      setTimeout(() => {
        setEditing(null); // will be re-fetched
        setEditorOpen(true);
      }, 500);
    }
  };

  const handleOpenEditor = (m: ModeloProntuario) => {
    setEditing(m);
    setEditorOpen(true);
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
                <Layers className="h-5 w-5 text-primary" />
                Modelos de Prontuário Estruturados
              </CardTitle>
              <CardDescription>
                Crie e personalize modelos com seções e campos configuráveis
              </CardDescription>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {modelos.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum modelo estruturado criado.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Novo modelo" para começar.
              </p>
            </div>
          ) : (
            modelos.map(m => {
              const totalCampos = m.estrutura_json.sections?.reduce(
                (sum, s) => sum + (s.campos?.length || 0), 0
              ) || 0;
              const totalSecoes = m.estrutura_json.sections?.length || 0;

              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    !m.ativo ? 'opacity-60 bg-muted/30' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{m.nome}</span>
                      {m.is_padrao && (
                        <Badge variant="outline">
                          <Star className="h-3 w-3 mr-1" /> Padrão
                        </Badge>
                      )}
                      {m.is_sistema && (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" /> Sistema
                        </Badge>
                      )}
                      {!m.ativo && <Badge variant="destructive">Inativo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {totalSecoes} seções · {totalCampos} campos
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Ações <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEditor(m)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {m.is_sistema ? 'Visualizar' : 'Personalizar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(m.id)} disabled={saving}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicar
                      </DropdownMenuItem>
                      {!m.is_sistema && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateInfo(m.id, { is_padrao: !m.is_padrao })}
                            disabled={saving}
                          >
                            {m.is_padrao
                              ? <><StarOff className="h-4 w-4 mr-2" /> Remover padrão</>
                              : <><Star className="h-4 w-4 mr-2" /> Definir padrão</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateInfo(m.id, { ativo: !m.ativo })}
                            disabled={saving}
                          >
                            {m.ativo
                              ? <><PowerOff className="h-4 w-4 mr-2" /> Desativar</>
                              : <><Power className="h-4 w-4 mr-2" /> Ativar</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setToDelete(m); setDeleteOpen(true); }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Modelo de Prontuário</DialogTitle>
            <DialogDescription>Dê um nome para o novo modelo</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Nome *</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Anamnese Clínica Geral"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving ? 'Criando...' : 'Criar e editar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor */}
      <TemplateEditorDialog
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditing(null); }}
        modelo={editing}
        onSave={updateEstrutura}
        saving={saving}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{toDelete?.nome}"? Prontuários já registrados não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
