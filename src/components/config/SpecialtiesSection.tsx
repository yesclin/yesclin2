import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Stethoscope, Plus, Pencil, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Specialty {
  id: string;
  name: string;
  area: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface SpecialtyFormData {
  name: string;
  area: string;
  description: string;
  is_active: boolean;
}

const emptyFormData: SpecialtyFormData = {
  name: "",
  area: "",
  description: "",
  is_active: true,
};

export function SpecialtiesSection() {
  const { clinic } = useClinicData();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState<SpecialtyFormData>(emptyFormData);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Specialty | null>(null);

  const canEdit = can("configuracoes", "edit");

  // Fetch all specialties (including inactive)
  const { data: specialties = [], isLoading } = useQuery({
    queryKey: ["specialties-management", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, area, description, is_active, created_at")
        .eq("clinic_id", clinic.id)
        .order("name");
      
      if (error) {
        console.error("Error fetching specialties:", error);
        throw error;
      }
      
      return data as Specialty[];
    },
    enabled: !!clinic?.id,
  });

  // Create specialty mutation
  const createMutation = useMutation({
    mutationFn: async (data: SpecialtyFormData) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");
      
      const { error } = await supabase.from("specialties").insert({
        clinic_id: clinic.id,
        name: data.name.trim(),
        area: data.area.trim() || null,
        description: data.description.trim() || null,
        is_active: data.is_active,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      toast.success("Especialidade criada com sucesso!");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      console.error("Error creating specialty:", error);
      toast.error("Erro ao criar especialidade");
    },
  });

  // Update specialty mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SpecialtyFormData }) => {
      const { error } = await supabase
        .from("specialties")
        .update({
          name: data.name.trim(),
          area: data.area.trim() || null,
          description: data.description.trim() || null,
          is_active: data.is_active,
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      toast.success("Especialidade atualizada com sucesso!");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      console.error("Error updating specialty:", error);
      toast.error("Erro ao atualizar especialidade");
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("specialties")
        .update({ is_active })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      toast.success(variables.is_active ? "Especialidade ativada" : "Especialidade desativada");
      setConfirmDeactivate(null);
    },
    onError: (error: Error) => {
      console.error("Error toggling specialty:", error);
      toast.error("Erro ao alterar status");
    },
  });

  const handleOpenCreate = () => {
    setEditingSpecialty(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      area: specialty.area || "",
      description: specialty.description || "",
      is_active: specialty.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSpecialty(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("O nome da especialidade é obrigatório");
      return;
    }

    if (editingSpecialty) {
      updateMutation.mutate({ id: editingSpecialty.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (specialty: Specialty) => {
    if (specialty.is_active) {
      // Show confirmation before deactivating
      setConfirmDeactivate(specialty);
    } else {
      toggleActiveMutation.mutate({ id: specialty.id, is_active: true });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const activeSpecialties = specialties.filter(s => s.is_active);
  const inactiveSpecialties = specialties.filter(s => !s.is_active);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Especialidades</CardTitle>
                <CardDescription>
                  Gerencie as especialidades disponíveis na clínica
                </CardDescription>
              </div>
            </div>
            {canEdit && (
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Especialidade
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : specialties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Stethoscope className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                Nenhuma especialidade cadastrada
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Adicione especialidades para organizar os atendimentos e prontuários por área de atuação.
              </p>
              {canEdit && (
                <Button onClick={handleOpenCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira especialidade
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active specialties */}
              {activeSpecialties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Ativas ({activeSpecialties.length})</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {activeSpecialties.map((specialty) => (
                      <div
                        key={specialty.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{specialty.name}</span>
                          </div>
                          {specialty.area && (
                            <span className="text-xs text-muted-foreground">{specialty.area}</span>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(specialty)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={specialty.is_active}
                              onCheckedChange={() => handleToggleActive(specialty)}
                              disabled={toggleActiveMutation.isPending}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive specialties */}
              {inactiveSpecialties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Inativas ({inactiveSpecialties.length})</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {inactiveSpecialties.map((specialty) => (
                      <div
                        key={specialty.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 opacity-60"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{specialty.name}</span>
                            <Badge variant="secondary" className="text-[10px]">Inativa</Badge>
                          </div>
                          {specialty.area && (
                            <span className="text-xs text-muted-foreground">{specialty.area}</span>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(specialty)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={specialty.is_active}
                              onCheckedChange={() => handleToggleActive(specialty)}
                              disabled={toggleActiveMutation.isPending}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {editingSpecialty ? "Editar Especialidade" : "Nova Especialidade"}
            </DialogTitle>
            <DialogDescription>
              {editingSpecialty 
                ? "Atualize as informações da especialidade" 
                : "Adicione uma nova especialidade à clínica"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="specialty-name">
                Nome da Especialidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="specialty-name"
                placeholder="Ex: Dermatologia, Pediatria, Fisioterapia..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty-area">Área (opcional)</Label>
              <Input
                id="specialty-area"
                placeholder="Ex: Saúde Mental, Estética, Reabilitação..."
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Agrupe especialidades por área para melhor organização
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty-description">Observação Interna (opcional)</Label>
              <Textarea
                id="specialty-description"
                placeholder="Notas internas sobre esta especialidade..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {editingSpecialty && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div>
                  <Label htmlFor="specialty-active">Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Especialidades inativas não aparecem nas seleções
                  </p>
                </div>
                <Switch
                  id="specialty-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Salvando..." : editingSpecialty ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivation confirmation */}
      <AlertDialog open={!!confirmDeactivate} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Desativar especialidade?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A especialidade <strong>"{confirmDeactivate?.name}"</strong> não aparecerá mais nas seleções.
              Os registros existentes serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeactivate && toggleActiveMutation.mutate({ 
                id: confirmDeactivate.id, 
                is_active: false 
              })}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
