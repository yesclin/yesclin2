import { CalendarCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicScheduleSection } from "@/components/config/agenda/ClinicScheduleSection";
import { ProfessionalScheduleSection } from "@/components/config/agenda/ProfessionalScheduleSection";
import { ScheduleBlocksSection } from "@/components/config/agenda/ScheduleBlocksSection";

export default function ConfigAgenda() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarCog className="h-6 w-6 text-primary" />
          Configurações de Agenda
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure horários de atendimento da clínica e de cada profissional
        </p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clinic">Horário da Clínica</TabsTrigger>
          <TabsTrigger value="professionals">Por Profissional</TabsTrigger>
          <TabsTrigger value="exceptions">Exceções</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="space-y-4">
          <ClinicScheduleSection />
        </TabsContent>

        <TabsContent value="professionals" className="space-y-4">
          <ProfessionalScheduleSection />
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          <ScheduleBlocksSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
