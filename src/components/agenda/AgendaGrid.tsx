import { useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AppointmentCard } from './AppointmentCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Appointment, ViewMode, GroupBy, Professional, Room, Specialty } from '@/types/agenda';

interface AgendaGridProps {
  appointments: Appointment[];
  viewMode: ViewMode;
  groupBy: GroupBy;
  selectedDate: Date;
  professionals: Professional[];
  rooms: Room[];
  specialties: Specialty[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onStatusChange?: (id: string, status: Appointment['status']) => void;
  onReschedule?: (appointment: Appointment) => void;
}

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

export function AgendaGrid({
  appointments,
  viewMode,
  groupBy,
  selectedDate,
  professionals,
  rooms,
  specialties,
  onAppointmentClick,
  onStatusChange,
  onReschedule,
}: AgendaGridProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    
    if (viewMode === 'daily') {
      filtered = filtered.filter(a => a.scheduled_date === format(selectedDate, 'yyyy-MM-dd'));
    } else if (viewMode === 'weekly') {
      const weekStart = format(weekDays[0], 'yyyy-MM-dd');
      const weekEnd = format(weekDays[6], 'yyyy-MM-dd');
      filtered = filtered.filter(a => a.scheduled_date >= weekStart && a.scheduled_date <= weekEnd);
    }
    
    return filtered;
  }, [appointments, viewMode, selectedDate, weekDays]);

  const groupedAppointments = useMemo(() => {
    if (groupBy === 'general') {
      return { 'Agenda Geral': filteredAppointments };
    }

    const groups: Record<string, Appointment[]> = {};
    
    filteredAppointments.forEach(apt => {
      let key: string;
      switch (groupBy) {
        case 'professional':
          key = apt.professional?.full_name || 'Sem profissional';
          break;
        case 'room':
          key = apt.room?.name || 'Sem sala';
          break;
        case 'specialty':
          key = apt.specialty?.name || 'Sem especialidade';
          break;
        case 'type':
          key = apt.appointment_type;
          break;
        case 'status':
          key = apt.status;
          break;
        default:
          key = 'Outros';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(apt);
    });
    
    return groups;
  }, [filteredAppointments, groupBy]);

  // Daily View
  if (viewMode === 'daily') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="grid" style={{ gridTemplateColumns: groupBy !== 'general' ? `80px repeat(${Object.keys(groupedAppointments).length}, minmax(200px, 1fr))` : '80px 1fr' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-muted border-b p-2 text-center text-sm font-medium">
              Hora
            </div>
            {Object.keys(groupedAppointments).map(group => (
              <div key={group} className="sticky top-0 z-10 bg-muted border-b border-l p-2 text-center text-sm font-medium truncate">
                {group}
              </div>
            ))}
            
            {/* Time slots */}
            {timeSlots.map(time => (
              <>
                <div key={`time-${time}`} className="border-b p-2 text-xs text-muted-foreground text-center bg-muted/30">
                  {time}
                </div>
                {Object.entries(groupedAppointments).map(([group, apts]) => {
                  const slotAppointments = apts.filter(a => a.start_time.slice(0, 5) === time);
                  return (
                    <div key={`${group}-${time}`} className="border-b border-l p-1 min-h-[60px]">
                      {slotAppointments.map(apt => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          compact
                          onClick={onAppointmentClick}
                          onStatusChange={onStatusChange}
                          onReschedule={onReschedule}
                        />
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Weekly View
  if (viewMode === 'weekly') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-8">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-muted border-b p-2 text-center text-sm font-medium">
              Hora
            </div>
            {weekDays.map(day => (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "sticky top-0 z-10 bg-muted border-b border-l p-2 text-center",
                  isSameDay(day, new Date()) && "bg-primary/10"
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  isSameDay(day, new Date()) && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
            
            {/* Time slots */}
            {timeSlots.filter((_, i) => i % 2 === 0).map(time => (
              <>
                <div key={`time-${time}`} className="border-b p-2 text-xs text-muted-foreground text-center bg-muted/30">
                  {time}
                </div>
                {weekDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const slotAppointments = filteredAppointments.filter(
                    a => a.scheduled_date === dayStr && a.start_time.slice(0, 2) === time.slice(0, 2)
                  );
                  const isWeekend = [0, 6].includes(day.getDay());
                  
                  return (
                    <div 
                      key={`${dayStr}-${time}`} 
                      className={cn(
                        "border-b border-l p-1 min-h-[80px]",
                        isWeekend && "bg-muted/20"
                      )}
                    >
                      {slotAppointments.slice(0, 2).map(apt => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          compact
                          onClick={onAppointmentClick}
                          onStatusChange={onStatusChange}
                          onReschedule={onReschedule}
                        />
                      ))}
                      {slotAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center mt-1">
                          +{slotAppointments.length - 2} mais
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Monthly View
  if (viewMode === 'monthly') {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthDays = Array.from({ length: 35 }, (_, i) => {
      const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      return addDays(weekStart, i);
    });

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {/* Header */}
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="bg-muted border-b p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
          
          {/* Days */}
          {monthDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayAppointments = filteredAppointments.filter(a => a.scheduled_date === dayStr);
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={dayStr}
                className={cn(
                  "border-b border-l p-2 min-h-[100px]",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>
                {dayAppointments.slice(0, 3).map(apt => (
                  <div 
                    key={apt.id}
                    className="text-xs p-1 mb-1 rounded bg-primary/10 truncate cursor-pointer hover:bg-primary/20"
                    onClick={() => onAppointmentClick?.(apt)}
                  >
                    {apt.start_time.slice(0, 5)} {apt.patient?.full_name?.split(' ')[0]}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Timeline View
  return (
    <div className="space-y-4">
      {Object.entries(groupedAppointments).map(([group, apts]) => (
        <div key={group} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">{group}</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-3 pl-8">
              {apts
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(apt => (
                  <div key={apt.id} className="relative">
                    <div className="absolute -left-8 top-4 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                    <AppointmentCard
                      appointment={apt}
                      onClick={onAppointmentClick}
                      onStatusChange={onStatusChange}
                      onReschedule={onReschedule}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
