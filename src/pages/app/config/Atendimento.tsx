import { Stethoscope } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentTypesCard } from "@/components/config/atendimento/AppointmentTypesCard";
import { AppointmentStatusCard } from "@/components/config/atendimento/AppointmentStatusCard";
import { AppointmentRulesCard } from "@/components/config/atendimento/AppointmentRulesCard";
import { IdleAlertSettingsCard } from "@/components/config/atendimento/IdleAlertSettingsCard";

export default function ConfigAtendimento() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          Configurações de Atendimento
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure tipos, status e alertas de atendimento
        </p>
      </div>

      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">Tipos & Status</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="alerts">Alertas de Ociosidade</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <AppointmentTypesCard />
            <AppointmentStatusCard />
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <AppointmentRulesCard />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <IdleAlertSettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
