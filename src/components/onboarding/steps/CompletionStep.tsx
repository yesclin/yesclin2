import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Users, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompletionStepProps {
  onComplete: () => void;
}

const checklistItems = [
  "Dados da clínica configurados",
  "Horários de atendimento definidos",
  "Sistema pronto para uso",
];

const nextSteps = [
  {
    icon: Users,
    title: "Cadastrar primeiro paciente",
    path: "/app/pacientes",
  },
  {
    icon: Calendar,
    title: "Agendar primeiro atendimento",
    path: "/app/agenda",
  },
  {
    icon: LayoutDashboard,
    title: "Explorar o dashboard",
    path: "/app",
  },
];

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onComplete();
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
      >
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Tudo pronto! 🎉
        </h2>
        <p className="text-muted-foreground">
          Seu sistema está configurado e pronto para uso.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left max-w-sm mx-auto">
        <p className="text-sm font-medium text-foreground">Configuração concluída:</p>
        {checklistItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {item}
          </motion.div>
        ))}
      </div>

      <div className="space-y-3 pt-4">
        <p className="text-sm font-medium text-foreground">Próximos passos sugeridos:</p>
        <div className="grid gap-2 max-w-sm mx-auto">
          {nextSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => handleNavigate(step.path)}
              >
                <step.icon className="h-4 w-4 text-primary" />
                {step.title}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <Button size="lg" onClick={() => handleNavigate("/app")}>
          Ir para o Dashboard
        </Button>
      </div>
    </motion.div>
  );
}
