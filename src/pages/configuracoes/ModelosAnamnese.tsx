/**
 * Página de Configurações > Modelos de Anamnese (V2 – Builder Profissional)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, MoreHorizontal, Pencil, Trash2, ClipboardList, Copy, ArrowLeft, Lock, Star, Stethoscope, FileText,
} from 'lucide-react';
import { useAnamnesisTemplatesV2, type AnamnesisTemplateV2 } from '@/hooks/useAnamnesisTemplatesV2';
import { AnamnesisTemplateBuilderDialog } from '@/components/configuracoes/AnamnesisTemplateBuilderDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ModelosAnamnese() {
  const { templates, isLoading, updateTemplate, deleteTemplate, cloneTemplate, isDeleting, isCloning } = useAnamnesisTemplatesV2();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AnamnesisTemplateV2 | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<AnamnesisTemplateV2 | null>(null);

  const handleEdit = (template: AnamnesisTemplateV2) => {
    if (template.is_system) {
      toast.error('Modelos do sistema não podem ser editados. Use "Clonar" para criar uma cópia editável.');
      return;
    }
    setSelectedTemplate(template);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setEditorOpen(true);
  };

  const handleClone = async (template: AnamnesisTemplateV2) => {
    await cloneTemplate({ sourceId: template.id, newName: `${template.name} (Cópia)` });
  };

  const handleDeleteClick = (template: AnamnesisTemplateV2) => {
    if (template.is_system) return;
    if (template.usage_count > 0) return;
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      await deleteTemplate(templateToDelete.id);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleToggleActive = async (template: AnamnesisTemplateV2) => {
    if (template.is_system) return;
    await updateTemplate({ id: template.id, is_active: !template.is_active });
  };

  const handleSetDefault = async (template: AnamnesisTemplateV2) => {
    await updateTemplate({ id: template.id, is_default: true });
  };

  const countFields = (t: AnamnesisTemplateV2) =>
    t.structure.reduce((sum, s) => sum + (s.fields?.length || 0), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/app/config/prontuario">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Modelos de Anamnese</h1>
          <p className="text-muted-foreground">
            Gerencie modelos com versionamento e multi-especialidade
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelos Cadastrados</CardTitle>
          <CardDescription>
            Modelos do sistema (🔒) não podem ser editados nem excluídos — apenas clonados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum modelo cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Ativo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead className="text-center">Seções</TableHead>
                  <TableHead className="text-center">Campos</TableHead>
                  <TableHead className="text-center">Versão</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(template => (
                  <TableRow key={template.id} className={template.is_system ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => handleToggleActive(template)}
                        disabled={template.is_system}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{template.name}</p>
                            {template.is_system && <Lock className="h-3 w-3 text-muted-foreground" />}
                            {template.is_default && (
                              <Badge variant="default" className="text-[10px] h-4 px-1">
                                <Star className="h-2.5 w-2.5 mr-0.5" /> Padrão
                              </Badge>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{template.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.specialty_name || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{template.structure.length}</TableCell>
                    <TableCell className="text-center">{countFields(template)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        v{template.current_version_number || 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background z-50">
                          {!template.is_system && (
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleClone(template)} disabled={isCloning}>
                            <Copy className="h-4 w-4 mr-2" /> Clonar
                          </DropdownMenuItem>
                          {!template.is_default && !template.is_system && (
                            <DropdownMenuItem onClick={() => handleSetDefault(template)}>
                              <Star className="h-4 w-4 mr-2" /> Definir como Padrão
                            </DropdownMenuItem>
                          )}
                          {!template.is_system && template.usage_count === 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(template)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AnamnesisTemplateBuilderDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={selectedTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo de anamnese?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{templateToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
