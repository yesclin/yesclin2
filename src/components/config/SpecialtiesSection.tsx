import { useState, useMemo } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  useStandardSpecialties, 
  useCustomSpecialties, 
  useCreateSpecialty, 
  useUpdateSpecialty, 
  useToggleSpecialty,
  type EnabledSpecialty 
} from "@/hooks/useEnabledSpecialties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
import { Stethoscope, Plus, Pencil, Loader2, AlertCircle, Globe, Building, Search } from "lucide-react";
import { SpecialtyFormDialog } from "./SpecialtyFormDialog";

interface Specialty {
  id: string;
  name: string;
  area: string | null;
  description: string | null;
  is_active: boolean;
  specialty_type?: 'padrao' | 'personalizada';
  clinic_id?: string | null;
  created_at?: string;
}

interface SpecialtyFormData {
  name: string;
  area: string;
  description: string;
  is_active: boolean;
}

export function SpecialtiesSection() {
  const { clinic } = useClinicData();
  const { isOwner } = usePermissions();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Specialty | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'padrao' | 'personalizada'>('padrao');

  // Hooks for data
  const { data: standardSpecialties = [], isLoading: loadingStandard } = useStandardSpecialties();
  const { data: customSpecialties = [], isLoading: loadingCustom } = useCustomSpecialties();
  
  const createMutation = useCreateSpecialty();
  const updateMutation = useUpdateSpecialty();
  const toggleMutation = useToggleSpecialty();

  // Group standard specialties by area
  const groupedStandardSpecialties = useMemo(() => {
    const filtered = standardSpecialties.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.area?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.reduce((acc, specialty) => {
      const area = specialty.area || 'Outros';
      if (!acc[area]) acc[area] = [];
      acc[area].push(specialty);
      return acc;
    }, {} as Record<string, EnabledSpecialty[]>);
  }, [standardSpecialties, searchTerm]);

  // Filter custom specialties
  const filteredCustomSpecialties = useMemo(() => {
    return customSpecialties.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.area?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customSpecialties, searchTerm]);

  const activeCustomSpecialties = filteredCustomSpecialties.filter(s => s.is_active);
  const inactiveCustomSpecialties = filteredCustomSpecialties.filter(s => !s.is_active);

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
    if (!formData.name.trim()) return;

    if (editingSpecialty) {
      updateMutation.mutate({ id: editingSpecialty.id, data: formData }, {
        onSuccess: handleCloseDialog,
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: handleCloseDialog,
      });
    }
  };

  const handleToggleActive = (specialty: Specialty) => {
    if (specialty.is_active) {
      setConfirmDeactivate(specialty);
    } else {
      toggleMutation.mutate({ specialtyId: specialty.id, isActive: true });
    }
  };

  const isLoading = loadingStandard || loadingCustom;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
                  Gerencie as especialidades disponíveis na clínica. 
                  Escolha entre especialidades padrão ou crie personalizadas.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar especialidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'padrao' | 'personalizada')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="padrao" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Padrão ({standardSpecialties.length})
                  </TabsTrigger>
                  <TabsTrigger value="personalizada" className="gap-2">
                    <Building className="h-4 w-4" />
                    Personalizadas ({customSpecialties.length})
                  </TabsTrigger>
                </TabsList>

                {/* Standard Specialties Tab */}
                <TabsContent value="padrao" className="mt-4">
                  <div className="rounded-lg border bg-muted/30 p-3 mb-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Especialidades Padrão</strong> são disponibilizadas globalmente pelo sistema. 
                      Estão prontas para uso em procedimentos, profissionais e prontuários.
                    </p>
                  </div>

                  {Object.keys(groupedStandardSpecialties).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma especialidade encontrada com "{searchTerm}"
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-6">
                        {Object.entries(groupedStandardSpecialties).sort().map(([area, specialties]) => (
                          <div key={area} className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1">
                              {area} ({specialties.length})
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {specialties.map((specialty) => (
                                <div
                                  key={specialty.id}
                                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="font-medium text-sm">{specialty.name}</span>
                                  </div>
                                  <Badge variant="outline" className="text-[10px]">
                                    Padrão
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Custom Specialties Tab */}
                <TabsContent value="personalizada" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="rounded-lg border bg-muted/30 p-3 flex-1 mr-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Especialidades Personalizadas</strong> são exclusivas desta clínica. 
                        Apenas proprietários podem criar e gerenciar.
                      </p>
                    </div>
                    {isOwner && (
                      <Button onClick={handleOpenCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova
                      </Button>
                    )}
                  </div>

                  {customSpecialties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Building className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">
                        Nenhuma especialidade personalizada
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Crie especialidades exclusivas para sua clínica quando as padrão não forem suficientes.
                      </p>
                      {isOwner && (
                        <Button onClick={handleOpenCreate} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Criar especialidade
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Active custom specialties */}
                      {activeCustomSpecialties.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-primary">
                            Habilitadas ({activeCustomSpecialties.length})
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {activeCustomSpecialties.map((specialty) => (
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
                                {isOwner && (
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
                                      disabled={toggleMutation.isPending}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inactive custom specialties */}
                      {inactiveCustomSpecialties.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Desabilitadas ({inactiveCustomSpecialties.length})
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {inactiveCustomSpecialties.map((specialty) => (
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
                                {isOwner && (
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
                                      disabled={toggleMutation.isPending}
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
                </TabsContent>
              </Tabs>
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
              onClick={() => confirmDeactivate && toggleMutation.mutate({ 
                specialtyId: confirmDeactivate.id, 
                isActive: false 
              }, {
                onSuccess: () => setConfirmDeactivate(null),
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
