import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { SpecialtyFormDialog } from "./SpecialtyFormDialog";

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

export function SpecialtiesSection() {
  const { clinic } = useClinicData();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
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
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSpecialty(null);
  };

  const handleSubmit = (formData: SpecialtyFormData) => {
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
                <CardTitle>Especialidades Habilitadas</CardTitle>
                <CardDescription>
                  Gerencie as especialidades disponíveis na clínica. 
                  Apenas especialidades ativas podem ser usadas em procedimentos, prontuários e agendamentos.
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
                Profissionais só podem ser vinculados a especialidades habilitadas.
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
              {/* Active (enabled) specialties */}
              {activeSpecialties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-primary">
                    Habilitadas ({activeSpecialties.length})
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Disponíveis para uso em procedimentos, profissionais e prontuários
                  </p>
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

              {/* Inactive (disabled) specialties */}
              {inactiveSpecialties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Desabilitadas ({inactiveSpecialties.length})
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Não disponíveis para uso. Ative para permitir novos vínculos.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {inactiveSpecialties.map((specialty) => (
                      <div
                        key={specialty.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-muted/30 opacity-70"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate text-muted-foreground">{specialty.name}</span>
                            <Badge variant="secondary" className="text-[10px]">Desabilitada</Badge>
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
      <SpecialtyFormDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        specialty={editingSpecialty}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Deactivation confirmation */}
      <AlertDialog open={!!confirmDeactivate} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Desabilitar especialidade?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                A especialidade <strong>"{confirmDeactivate?.name}"</strong> será desabilitada.
              </p>
              <p className="text-sm">
                <strong>Isso significa que:</strong>
              </p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Novos profissionais não poderão ser vinculados a ela</li>
                <li>Novos procedimentos não poderão usá-la</li>
                <li>Novos agendamentos não poderão selecioná-la</li>
                <li>Registros existentes serão mantidos</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeactivate && toggleActiveMutation.mutate({ 
                id: confirmDeactivate.id, 
                is_active: false 
              })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
