import { Stethoscope, Clock, Users, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

// Placeholder page for operational attendance management
// This will be expanded with real functionality as the feature develops

export default function Atendimento() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          Atendimento
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os atendimentos em andamento e acompanhe o fluxo de pacientes
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Espera</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">pacientes aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Play className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">consultas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizados Hoje</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">atendimentos concluídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">ações pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fila de Atendimento
          </CardTitle>
          <CardDescription>
            Visualize e gerencie os pacientes na fila de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Stethoscope className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum atendimento no momento</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Os pacientes agendados aparecerão aqui quando chegarem para atendimento. 
              Use a agenda para visualizar os próximos compromissos.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/app/agenda")}>
                Ir para Agenda
              </Button>
              <Button onClick={() => navigate("/app/pacientes")}>
                Buscar Paciente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Módulo de Atendimento</h4>
              <p className="text-sm text-muted-foreground">
                Este módulo permite gerenciar o fluxo de atendimento em tempo real: 
                check-in de pacientes, chamada para consulta, acompanhamento de tempo 
                e finalização. Integrado com a Agenda e o Prontuário.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="secondary">Em desenvolvimento</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
