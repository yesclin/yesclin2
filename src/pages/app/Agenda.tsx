import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CalendarPlus, Ban, Settings, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgendaRealData } from "@/hooks/useAgendaRealData";
import { useUpdateAppointmentStatus, useCreateAppointment, type AppointmentFormData } from "@/hooks/useAppointments";
import { useTissGuideGeneration } from "@/hooks/useTissGuideGeneration";
import { usePermissions } from "@/hooks/usePermissions";
import { AgendaFilters } from "@/components/agenda/AgendaFilters";
import { AgendaStats } from "@/components/agenda/AgendaStats";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { AgendaInsights } from "@/components/agenda/AgendaInsights";
import { AgendaEmptyState } from "@/components/agenda/AgendaEmptyState";
import { ProfessionalTabs } from "@/components/agenda/ProfessionalTabs";
import { AppointmentDialog } from "@/components/agenda/AppointmentDialog";
import { BlockDialog } from "@/components/agenda/BlockDialog";
import { TissGuideGenerationDialog, GeneratedGuideData } from "@/components/agenda/TissGuideGenerationDialog";
import { AppointmentMaterialsDialog } from "@/components/agenda/AppointmentMaterialsDialog";
import { ProductSaleDialog } from "@/components/agenda/ProductSaleDialog";
import { StockValidationDialog } from "@/components/agenda/StockValidationDialog";
import type { AgendaFilters as FiltersType, ViewMode, GroupBy, Appointment, AppointmentStatus } from "@/types/agenda";
import { toast } from "sonner";
import { validateProcedureStock, StockValidationResult } from "@/hooks/useProcedureStockValidation";

export default function Agenda() {
  const navigate = useNavigate();
  const { role } = usePermissions();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [groupBy, setGroupBy] = useState<GroupBy>('professional');
  const [filters, setFilters] = useState<FiltersType>({
    startDate: new Date(),
    endDate: new Date(),
  });
  
  // Professional tabs state - null means "Todos"
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  
  // Dialogs
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentDialogMode, setAppointmentDialogMode] = useState<'create' | 'fitIn' | 'reschedule'>('create');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>();
  
  // TISS Guide Generation
  const [tissDialogOpen, setTissDialogOpen] = useState(false);
  const { pendingAppointment, setPendingAppointment, generateGuide } = useTissGuideGeneration();
  
  // Material Consumption
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [finalizingAppointment, setFinalizingAppointment] = useState<Appointment | null>(null);
  
  // Product Sale
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [saleAppointment, setSaleAppointment] = useState<Appointment | null>(null);
  
  // Stock Validation
  const [stockValidationDialogOpen, setStockValidationDialogOpen] = useState(false);
  const [stockValidationResult, setStockValidationResult] = useState<StockValidationResult | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ appointmentId: string; status: AppointmentStatus } | null>(null);
  
  // Real data from Supabase (now includes real schedules)
  const { 
    specialties, 
    rooms, 
    professionals, 
    patients, 
    insurances, 
    appointments, 
    stats, 
    insights,
    isLoading: dataLoading,
    refetchAppointments,
    clinicSchedule,
    professionalSchedules,
  } = useAgendaRealData(selectedDate, viewMode === 'timeline' ? 'daily' : viewMode);
  
  // Mutations for real database operations
  const updateStatusMutation = useUpdateAppointmentStatus();
  const createAppointmentMutation = useCreateAppointment();

  // RBAC: Profissional vê apenas sua própria aba
  // TODO: Replace with actual user's professional_id when available
  const userProfessionalId = role === 'profissional' ? professionals[0]?.id : null;
  
  // If user is a professional, force their tab
  const effectiveSelectedProfessionalId = role === 'profissional' 
    ? userProfessionalId 
    : selectedProfessionalId;

  // Filter professionals based on role
  const visibleProfessionals = useMemo(() => {
    if (role === 'profissional' && userProfessionalId) {
      return professionals.filter(p => p.id === userProfessionalId);
    }
    return professionals;
  }, [professionals, role, userProfessionalId]);

  // Filter appointments by selected professional tab and other filters
  const filteredAppointments = useMemo(() => {
    let result = appointments;
    
    // Filter by professional tab
    if (effectiveSelectedProfessionalId) {
      result = result.filter(apt => apt.professional_id === effectiveSelectedProfessionalId);
    }
    
    // Apply other filters (only professionalId if not using tabs)
    if (filters.professionalId && !effectiveSelectedProfessionalId) {
      result = result.filter(apt => apt.professional_id === filters.professionalId);
    }
    if (filters.specialtyId) {
      result = result.filter(apt => apt.specialty_id === filters.specialtyId);
    }
    if (filters.roomId) {
      result = result.filter(apt => apt.room_id === filters.roomId);
    }
    if (filters.appointmentType) {
      result = result.filter(apt => apt.appointment_type === filters.appointmentType);
    }
    if (filters.paymentType) {
      result = result.filter(apt => apt.payment_type === filters.paymentType);
    }
    if (filters.status) {
      result = result.filter(apt => apt.status === filters.status);
    }
    
    return result;
  }, [appointments, effectiveSelectedProfessionalId, filters]);

  // Get selected professional name for empty state
  const selectedProfessionalName = effectiveSelectedProfessionalId
    ? professionals.find(p => p.id === effectiveSelectedProfessionalId)?.full_name
    : undefined;

  const openCreateDialog = () => {
    setAppointmentDialogMode('create');
    setSelectedAppointment(undefined);
    setAppointmentDialogOpen(true);
  };

  const openFitInDialog = () => {
    setAppointmentDialogMode('fitIn');
    setSelectedAppointment(undefined);
    setAppointmentDialogOpen(true);
  };

  const handleReschedule = (apt: Appointment) => {
    setAppointmentDialogMode('reschedule');
    setSelectedAppointment(apt);
    setAppointmentDialogOpen(true);
  };

  // Navigate to prontuário when starting an appointment
  const navigateToProntuario = useCallback((patientId: string) => {
    navigate(`/app/prontuario?paciente=${patientId}`);
  }, [navigate]);

  // Handle status change with stock validation and material consumption
  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: AppointmentStatus) => {
    const apt = appointments.find(a => a.id === appointmentId);
    
    if (!apt) return;
    
    // Check if starting service ("em_atendimento") - validate stock first
    if (newStatus === 'em_atendimento' && apt.procedure_id) {
      try {
        const validation = await validateProcedureStock(apt.procedure_id);
        
        if (!validation.isValid) {
          // Stock is insufficient
          setStockValidationResult(validation);
          setPendingStatusChange({ appointmentId, status: newStatus });
          setStockValidationDialogOpen(true);
          return; // Don't proceed until user decides
        }
      } catch (error) {
        console.error("Error validating stock:", error);
        toast.error("Erro ao validar estoque do procedimento");
        return;
      }
    }
    
    // Check if finalizing an appointment - show materials dialog first
    if (newStatus === 'finalizado') {
      setFinalizingAppointment(apt);
      setMaterialsDialogOpen(true);
    } else if (newStatus === 'em_atendimento') {
      // Update status in database then navigate to prontuário
      try {
        await updateStatusMutation.mutateAsync({ id: appointmentId, status: newStatus });
        if (apt.patient_id) {
          navigateToProntuario(apt.patient_id);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    } else {
      // Update status in database for other status changes
      updateStatusMutation.mutate({ id: appointmentId, status: newStatus });
    }
  }, [appointments, navigateToProntuario, updateStatusMutation]);

  // Handle stock validation confirmation (allow negative stock)
  const handleStockValidationConfirm = useCallback(async () => {
    setStockValidationDialogOpen(false);
    
    if (pendingStatusChange) {
      // Proceed with status change even with insufficient stock
      toast.warning("Atenção: Estoque ficará negativo após consumo dos materiais");
      
      try {
        await updateStatusMutation.mutateAsync({ 
          id: pendingStatusChange.appointmentId, 
          status: pendingStatusChange.status 
        });
        
        // Navigate to prontuário if starting appointment
        if (pendingStatusChange.status === 'em_atendimento') {
          const apt = appointments.find(a => a.id === pendingStatusChange.appointmentId);
          if (apt?.patient_id) {
            navigateToProntuario(apt.patient_id);
          }
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
    
    setStockValidationResult(null);
    setPendingStatusChange(null);
  }, [pendingStatusChange, appointments, navigateToProntuario, updateStatusMutation]);

  // Handle stock validation cancel
  const handleStockValidationCancel = useCallback(() => {
    setStockValidationDialogOpen(false);
    setStockValidationResult(null);
    setPendingStatusChange(null);
    toast.info("Atendimento não iniciado. Reponha o estoque antes de continuar.");
  }, []);

  // After materials dialog confirms, proceed with TISS if needed
  const handleMaterialsConfirm = useCallback(async () => {
    setMaterialsDialogOpen(false);
    
    if (!finalizingAppointment) return;
    
    // Update status in database
    try {
      await updateStatusMutation.mutateAsync({ 
        id: finalizingAppointment.id, 
        status: 'finalizado' 
      });
      
      // Check if appointment has insurance for TISS guide
      if (finalizingAppointment.payment_type === 'convenio' && finalizingAppointment.insurance) {
        const finalizedApt: Appointment = { ...finalizingAppointment, status: 'finalizado' };
        setPendingAppointment(finalizedApt);
        setTissDialogOpen(true);
      }
    } catch (error) {
      console.error("Error finalizing appointment:", error);
    }
    
    setFinalizingAppointment(null);
  }, [finalizingAppointment, setPendingAppointment, updateStatusMutation]);

  const handleMaterialsCancel = useCallback(() => {
    setMaterialsDialogOpen(false);
    setFinalizingAppointment(null);
  }, []);

  const handleTissGuideConfirm = useCallback(async (guideData: GeneratedGuideData) => {
    await generateGuide(guideData);
    setPendingAppointment(null);
  }, [generateGuide, setPendingAppointment]);

  const handleTissGuideSkip = useCallback(() => {
    setPendingAppointment(null);
  }, [setPendingAppointment]);

  // Handle professional tab change
  const handleProfessionalTabChange = useCallback((professionalId: string | null) => {
    setSelectedProfessionalId(professionalId);
    // Clear professional filter when using tabs
    if (filters.professionalId) {
      setFilters(prev => ({ ...prev, professionalId: undefined }));
    }
  }, [filters.professionalId]);

  // Handle launch sale
  const handleLaunchSale = useCallback((apt: Appointment) => {
    if (!apt.patient) {
      toast.error("Agendamento sem paciente vinculado");
      return;
    }
    setSaleAppointment(apt);
    setSaleDialogOpen(true);
  }, []);

  // Handle appointment creation from dialog
  const handleAppointmentSubmit = useCallback((data: {
    patient_id?: string;
    professional_id?: string;
    procedure_id?: string;
    specialty_id?: string;
    room_id?: string;
    scheduled_date?: Date;
    start_time?: string;
    duration_minutes?: string;
    appointment_type?: string;
    payment_type?: string;
    insurance_id?: string;
    expected_value?: number;
    notes?: string;
    is_fit_in?: boolean;
  }) => {
    // Transform to AppointmentFormData
    const formData: AppointmentFormData = {
      patient_id: data.patient_id || '',
      professional_id: data.professional_id || '',
      scheduled_date: data.scheduled_date || new Date(),
      start_time: data.start_time || '08:00',
      duration_minutes: parseInt(data.duration_minutes || '30'),
      appointment_type: (data.appointment_type || 'consulta') as 'consulta' | 'retorno' | 'procedimento',
      payment_type: data.payment_type || 'particular',
      specialty_id: data.specialty_id,
      room_id: data.room_id,
      insurance_id: data.insurance_id,
      procedure_id: data.procedure_id,
      notes: data.notes,
      is_fit_in: data.is_fit_in,
    };
    
    createAppointmentMutation.mutate(formData, {
      onSuccess: () => {
        setAppointmentDialogOpen(false);
        refetchAppointments();
      },
    });
  }, [createAppointmentMutation, refetchAppointments]);

  // Determine if professional field should be locked in dialog
  const lockedProfessionalIdForDialog = effectiveSelectedProfessionalId || undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gerencie os atendimentos da clínica</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openFitInDialog}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Encaixe
          </Button>
          <Button variant="outline" onClick={() => setBlockDialogOpen(true)}>
            <Ban className="mr-2 h-4 w-4" />
            Bloquear
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="sala-espera">Sala de Espera</TabsTrigger>
          <TabsTrigger value="bloqueios">Bloqueios</TabsTrigger>
          <TabsTrigger value="config" onClick={() => navigate('/app/config/agenda')}>
            <Settings className="h-4 w-4 mr-1" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          {/* Loading State */}
          {dataLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando agenda...</span>
            </div>
          )}
          
          {!dataLoading && (
            <>
              {/* Professional Tabs - Only show if not a professional user or has multiple professionals */}
              {(role !== 'profissional' || visibleProfessionals.length > 1) && (
                <ProfessionalTabs
                  professionals={visibleProfessionals}
                  selectedProfessionalId={effectiveSelectedProfessionalId}
                  onSelectProfessional={handleProfessionalTabChange}
                  maxVisibleTabs={5}
                />
              )}
              
              <AgendaStats stats={stats} />
          
          <AgendaFilters
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            professionals={visibleProfessionals}
            specialties={specialties}
            rooms={rooms}
            insurances={insurances}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />

          {filteredAppointments.length > 0 ? (
            <AgendaGrid
              appointments={filteredAppointments}
              viewMode={viewMode}
              groupBy={effectiveSelectedProfessionalId ? 'general' : groupBy}
              selectedDate={selectedDate}
              professionals={visibleProfessionals}
              rooms={rooms}
              specialties={specialties}
              onReschedule={handleReschedule}
              onStatusChange={handleStatusChange}
              onLaunchSale={handleLaunchSale}
            />
          ) : (
            <AgendaEmptyState
              professionalName={selectedProfessionalName}
              onCreateAppointment={openCreateDialog}
            />
          )}

          <AgendaInsights insights={insights} />
            </>
          )}
        </TabsContent>

        <TabsContent value="sala-espera">
          <WaitingRoomContent 
            appointments={appointments.filter(a => 
              a.scheduled_date === format(new Date(), 'yyyy-MM-dd') &&
              ['chegou', 'em_atendimento'].includes(a.status)
            )}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="bloqueios">
          <div className="text-center py-12 text-muted-foreground">
            <Ban className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum bloqueio configurado</p>
            <Button variant="outline" className="mt-4" onClick={() => setBlockDialogOpen(true)}>
              Criar Bloqueio
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        mode={appointmentDialogMode}
        professionals={professionals}
        patients={patients}
        rooms={rooms}
        specialties={specialties}
        insurances={insurances}
        appointment={selectedAppointment}
        defaultDate={selectedDate}
        lockedProfessionalId={lockedProfessionalIdForDialog}
        existingAppointments={appointments}
        clinicSchedule={clinicSchedule}
        professionalSchedules={professionalSchedules}
        onSubmit={handleAppointmentSubmit}
      />

      <BlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
      />

      {/* TISS Guide Generation Dialog */}
      <TissGuideGenerationDialog
        open={tissDialogOpen}
        onOpenChange={setTissDialogOpen}
        appointment={pendingAppointment}
        onConfirm={handleTissGuideConfirm}
        onSkip={handleTissGuideSkip}
      />

      {/* Material Consumption Dialog */}
      <AppointmentMaterialsDialog
        open={materialsDialogOpen}
        onOpenChange={setMaterialsDialogOpen}
        appointmentId={finalizingAppointment?.id || ''}
        procedureName={finalizingAppointment?.procedure?.name}
        onConfirm={handleMaterialsConfirm}
        onCancel={handleMaterialsCancel}
      />

      {/* Stock Validation Dialog */}
      <StockValidationDialog
        open={stockValidationDialogOpen}
        onOpenChange={setStockValidationDialogOpen}
        validationResult={stockValidationResult}
        onConfirm={handleStockValidationConfirm}
        onCancel={handleStockValidationCancel}
      />

      {/* Product Sale Dialog */}
      {saleAppointment && saleAppointment.patient && (
        <ProductSaleDialog
          open={saleDialogOpen}
          onOpenChange={setSaleDialogOpen}
          patientId={saleAppointment.patient_id}
          patientName={saleAppointment.patient.full_name}
          appointmentId={saleAppointment.id}
          onSuccess={() => setSaleAppointment(null)}
        />
      )}
    </div>
  );
}

// Waiting Room inline component
interface WaitingRoomContentProps {
  appointments: Appointment[];
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
}

function WaitingRoomContent({ appointments, onStatusChange }: WaitingRoomContentProps) {
  const waiting = appointments.filter(a => a.status === 'chegou');
  const inProgress = appointments.filter(a => a.status === 'em_atendimento');

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warning" />
          Aguardando ({waiting.length})
        </h3>
        <div className="space-y-3">
          {waiting.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum paciente aguardando</p>
          ) : (
            waiting.map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{apt.patient?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {apt.start_time.slice(0, 5)} • {apt.professional?.full_name}
                  </p>
                  {apt.insurance && (
                    <p className="text-xs text-primary mt-1">{apt.insurance.name}</p>
                  )}
                </div>
                <Button 
                  size="sm"
                  onClick={() => onStatusChange?.(apt.id, 'em_atendimento')}
                >
                  Iniciar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Em Atendimento ({inProgress.length})
        </h3>
        <div className="space-y-3">
          {inProgress.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum atendimento em andamento</p>
          ) : (
            inProgress.map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{apt.patient?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {apt.professional?.full_name}
                  </p>
                  {apt.insurance && (
                    <p className="text-xs text-primary mt-1">{apt.insurance.name}</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusChange?.(apt.id, 'finalizado')}
                >
                  Finalizar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
