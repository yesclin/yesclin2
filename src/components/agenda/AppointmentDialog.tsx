import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus, Search, Clock, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Professional, Patient, Room, Specialty, Insurance, Appointment } from "@/types/agenda";
import { typeLabels } from "@/types/agenda";
import { useProceduresList, Procedure } from "@/hooks/useProceduresCRUD";
import { useSlotSuggestions } from "@/hooks/useSlotSuggestions";
import { useConflictDetection } from "@/hooks/useConflictDetection";
import { usePermissions } from "@/hooks/usePermissions";
import { SlotSuggestions } from "./SlotSuggestions";
import { ConflictAlert } from "./ConflictAlert";
import { ConflictConfirmDialog } from "./ConflictConfirmDialog";
import { ProcedureProductsPreview } from "./ProcedureProductsPreview";
import { WeekSchedule } from "@/components/config/EnhancedWorkingHoursCard";

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Selecione um paciente"),
  professional_id: z.string().min(1, "Selecione um profissional"),
  procedure_id: z.string().optional(),
  specialty_id: z.string().optional(),
  room_id: z.string().optional(),
  scheduled_date: z.date({ required_error: "Selecione uma data" }),
  start_time: z.string().min(1, "Informe o horário"),
  duration_minutes: z.string().min(1, "Informe a duração"),
  appointment_type: z.string().min(1, "Selecione o tipo"),
  payment_type: z.string().min(1, "Selecione a forma de pagamento"),
  insurance_id: z.string().optional(),
  expected_value: z.number().optional(),
  notes: z.string().optional(),
  is_fit_in: z.boolean().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'fitIn' | 'reschedule';
  professionals: Professional[];
  patients: Patient[];
  rooms: Room[];
  specialties: Specialty[];
  insurances: Insurance[];
  appointment?: Appointment;
  defaultDate?: Date;
  defaultStartTime?: string;
  /** If provided, the professional field will be pre-filled and locked */
  lockedProfessionalId?: string;
  onSubmit?: (data: AppointmentFormData) => void;
  /** All existing appointments for slot suggestion calculation */
  existingAppointments?: Appointment[];
  /** Clinic schedule for slot suggestions */
  clinicSchedule?: WeekSchedule | null;
  /** Professional schedule configs for slot suggestions */
  professionalSchedules?: Map<string, { useClinicDefault: boolean; workingDays: WeekSchedule }>;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  mode,
  professionals,
  patients,
  rooms,
  specialties,
  insurances,
  appointment,
  defaultDate,
  defaultStartTime,
  lockedProfessionalId,
  onSubmit,
  existingAppointments = [],
  clinicSchedule = null,
  professionalSchedules = new Map(),
}: AppointmentDialogProps) {
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  
  // RBAC
  // NOTE: UI-only gating. All data operations must still be protected server-side.
  const { isOwner, isAdmin } = usePermissions();
  const canOverrideConflicts = isOwner || isAdmin;
  
  // Fetch procedures from database
  const { data: procedures = [], isLoading: proceduresLoading } = useProceduresList(false);
  
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: appointment?.patient_id || "",
      professional_id: lockedProfessionalId || appointment?.professional_id || "",
      procedure_id: appointment?.procedure_id || "",
      specialty_id: appointment?.specialty_id || "",
      room_id: appointment?.room_id || "",
      scheduled_date: appointment ? new Date(appointment.scheduled_date) : defaultDate || new Date(),
      start_time: appointment?.start_time?.slice(0, 5) || defaultStartTime || "08:00",
      duration_minutes: String(appointment?.duration_minutes || 30),
      appointment_type: appointment?.appointment_type || "consulta",
      payment_type: appointment?.payment_type || "particular",
      insurance_id: appointment?.insurance_id || "",
      expected_value: appointment?.expected_value || 0,
      notes: appointment?.notes || "",
      is_fit_in: mode === 'fitIn',
    },
  });

  // If lockedProfessionalId changes, update the form
  useEffect(() => {
    if (lockedProfessionalId) {
      form.setValue("professional_id", lockedProfessionalId);
    }
  }, [lockedProfessionalId, form]);

  // Update form when slot-click defaults change
  useEffect(() => {
    if (open && defaultStartTime) {
      form.setValue("start_time", defaultStartTime);
    }
  }, [open, defaultStartTime, form]);

  useEffect(() => {
    if (open && defaultDate) {
      form.setValue("scheduled_date", defaultDate);
    }
  }, [open, defaultDate, form]);

  const watchPaymentType = form.watch("payment_type");
  const watchProcedureId = form.watch("procedure_id");
  const watchProfessionalId = form.watch("professional_id");
  const watchScheduledDate = form.watch("scheduled_date");
  const watchDurationMinutes = form.watch("duration_minutes");
  const watchStartTime = form.watch("start_time");
  const watchIsFitIn = form.watch("is_fit_in");

  // Auto-fill duration, price, and specialty when procedure is selected
  useEffect(() => {
    if (watchProcedureId && watchProcedureId !== "none") {
      const procedure = procedures.find(p => p.id === watchProcedureId);
      if (procedure) {
        setSelectedProcedure(procedure);
        form.setValue("duration_minutes", String(procedure.duration_minutes));
        if (procedure.price) {
          form.setValue("expected_value", procedure.price);
        }
        // Set specialty_id directly from procedure if available
        if (procedure.specialty_id) {
          form.setValue("specialty_id", procedure.specialty_id);
        } else if (procedure.specialty) {
          // Fallback: match by name for backwards compatibility
          const matchingSpecialty = specialties.find(s => 
            s.name.toLowerCase() === procedure.specialty?.toLowerCase()
          );
          if (matchingSpecialty) {
            form.setValue("specialty_id", matchingSpecialty.id);
          }
        }
      }
    } else {
      setSelectedProcedure(null);
    }
  }, [watchProcedureId, procedures, form, specialties]);

  // Get professional schedule for slot suggestions
  const professionalScheduleData = useMemo(() => {
    if (!watchProfessionalId) {
      return { useClinicDefault: true, workingDays: null };
    }
    const config = professionalSchedules.get(watchProfessionalId);
    if (config) {
      return { useClinicDefault: config.useClinicDefault, workingDays: config.workingDays };
    }
    return { useClinicDefault: true, workingDays: null };
  }, [watchProfessionalId, professionalSchedules]);

  // Slot suggestions
  const { suggestions, isLoading: suggestionsLoading, noSlotsAvailable } = useSlotSuggestions({
    professionalId: watchProfessionalId,
    selectedDate: watchScheduledDate || new Date(),
    durationMinutes: parseInt(watchDurationMinutes) || 30,
    existingAppointments,
    clinicSchedule,
    professionalSchedule: professionalScheduleData.workingDays,
    useClinicDefault: professionalScheduleData.useClinicDefault,
    maxSuggestions: 6,
  });

  // Handle slot selection
  const handleSlotSelect = (slot: { time: string; date: Date }) => {
    form.setValue("scheduled_date", slot.date);
    form.setValue("start_time", slot.time);
    form.setValue("is_fit_in", true);
  };

  // Conflict detection
  const conflictResult = useConflictDetection({
    professionalId: watchProfessionalId,
    scheduledDate: watchScheduledDate,
    startTime: watchStartTime,
    durationMinutes: parseInt(watchDurationMinutes) || 30,
    existingAppointments,
    clinicSchedule,
    professionalSchedule: professionalScheduleData.workingDays,
    useClinicDefault: professionalScheduleData.useClinicDefault,
    editingAppointmentId: appointment?.id,
    isFitIn: watchIsFitIn || mode === 'fitIn',
  });

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleSubmit = (data: AppointmentFormData) => {
    // Check for critical conflicts - block save
    if (conflictResult.hasCriticalConflict) {
      toast.error("Não é possível salvar com conflitos críticos. Ajuste o horário.");
      return;
    }
    
    // Check for warning conflicts - show confirmation for admins/owners
    if (conflictResult.hasWarningConflict && canOverrideConflicts) {
      setShowConflictConfirm(true);
      return;
    }
    
    // Warning conflicts for non-admin/owner - block
    if (conflictResult.hasWarningConflict && !canOverrideConflicts) {
      toast.error("Conflito de horário detectado. Ajuste o horário ou solicite a um administrador.");
      return;
    }
    
    performSave(data);
  };
  
  const performSave = (data: AppointmentFormData) => {
    onSubmit?.(data);
    toast.success(
      mode === 'create' ? "Agendamento criado com sucesso!" :
      mode === 'fitIn' ? "Encaixe criado com sucesso!" :
      "Agendamento reagendado com sucesso!"
    );
    onOpenChange(false);
    form.reset();
  };
  
  const handleConflictConfirm = () => {
    setShowConflictConfirm(false);
    performSave(form.getValues());
  };

  const title = {
    create: "Novo Agendamento",
    fitIn: "Criar Encaixe",
    reschedule: "Reagendar Atendimento",
  }[mode];

  const description = {
    create: "Preencha os dados para criar um novo agendamento.",
    fitIn: "Crie um encaixe entre os horários existentes.",
    reschedule: "Selecione a nova data e horário.",
  }[mode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Selection */}
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Paciente *</FormLabel>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar paciente..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button type="button" variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredPatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Professional */}
              <FormField
                control={form.control}
                name="professional_id"
                render={({ field }) => {
                  const lockedProfessional = lockedProfessionalId 
                    ? professionals.find(p => p.id === lockedProfessionalId)
                    : null;

                  return (
                    <FormItem>
                      <FormLabel>Profissional *</FormLabel>
                      {lockedProfessional ? (
                        // Locked mode - show professional name as disabled input
                        <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border bg-muted text-muted-foreground">
                          <div
                            className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0"
                            style={{ backgroundColor: lockedProfessional.color || "#6366f1" }}
                          >
                            {lockedProfessional.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </div>
                          <span className="truncate">{lockedProfessional.full_name}</span>
                        </div>
                      ) : (
                        // Normal mode - selectable
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professionals.map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                {prof.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Procedure Selection */}
              <FormField
                control={form.control}
                name="procedure_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Procedimento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={proceduresLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={proceduresLoading ? "Carregando..." : "Selecione o procedimento (opcional)"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum procedimento</SelectItem>
                        {procedures.map((proc) => (
                          <SelectItem key={proc.id} value={proc.id}>
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span>{proc.name}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{proc.duration_minutes}min</span>
                                {proc.price && (
                                  <>
                                    <Banknote className="h-3 w-3 ml-2" />
                                    <span>
                                      {proc.price.toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProcedure && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Duração e valor preenchidos automaticamente com base no procedimento selecionado.
                      </p>
                    )}
                    
                    {/* Procedure Products Preview */}
                    <ProcedureProductsPreview 
                      procedureId={watchProcedureId === "none" ? null : watchProcedureId}
                      procedureName={selectedProcedure?.name}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Specialty */}
              <FormField
                control={form.control}
                name="specialty_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {specialties.map((spec) => (
                          <SelectItem key={spec.id} value={spec.id}>
                            {spec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Room */}
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sala</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Appointment Type */}
              <FormField
                control={form.control}
                name="appointment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Atendimento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={ptBR}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time */}
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min) *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1h30</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slot Suggestions */}
              {watchProfessionalId && (
                <div className="md:col-span-2">
                  <SlotSuggestions
                    suggestions={suggestions}
                    isLoading={suggestionsLoading}
                    noSlotsAvailable={noSlotsAvailable}
                    onSelectSlot={handleSlotSelect}
                  />
                </div>
              )}

              {/* Conflict Alert */}
              {conflictResult.hasConflict && watchProfessionalId && watchStartTime && (
                <div className="md:col-span-2">
                  <ConflictAlert conflicts={conflictResult.conflicts} />
                </div>
              )}

              {/* Payment Type */}
              <FormField
                control={form.control}
                name="payment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="particular">Particular</SelectItem>
                        <SelectItem value="convenio">Convênio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Insurance (conditional) */}
              {watchPaymentType === 'convenio' && (
                <FormField
                  control={form.control}
                  name="insurance_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Convênio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {insurances.map((ins) => (
                            <SelectItem key={ins.id} value={ins.id}>
                              {ins.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Expected Value - shows when procedure has price or payment is particular */}
              {(selectedProcedure?.price || watchPaymentType === 'particular') && (
                <FormField
                  control={form.control}
                  name="expected_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Esperado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      {selectedProcedure?.price && (
                        <p className="text-xs text-muted-foreground">
                          Valor do procedimento: {selectedProcedure.price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={conflictResult.hasCriticalConflict}
                className={cn(
                  conflictResult.hasWarningConflict && !conflictResult.hasCriticalConflict && "bg-amber-600 hover:bg-amber-700"
                )}
              >
                {conflictResult.hasWarningConflict && !conflictResult.hasCriticalConflict && canOverrideConflicts
                  ? 'Confirmar com Conflito'
                  : mode === 'create' ? 'Criar Agendamento' :
                    mode === 'fitIn' ? 'Criar Encaixe' :
                    'Reagendar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        
        {/* Conflict Confirmation Dialog */}
        <ConflictConfirmDialog
          open={showConflictConfirm}
          onOpenChange={setShowConflictConfirm}
          conflicts={conflictResult.conflicts}
          onConfirm={handleConflictConfirm}
          onCancel={() => setShowConflictConfirm(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
