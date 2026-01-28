import { AlertTriangle, XCircle, Info, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ScheduleConflict } from "@/hooks/useConflictDetection";

interface ConflictAlertProps {
  conflicts: ScheduleConflict[];
  className?: string;
}

export function ConflictAlert({ conflicts, className }: ConflictAlertProps) {
  if (conflicts.length === 0) return null;
  
  const hasCritical = conflicts.some(c => c.severity === 'critical');
  const primaryConflict = conflicts.find(c => c.severity === 'critical') || conflicts[0];
  
  return (
    <Alert
      variant={hasCritical ? "destructive" : "default"}
      className={cn(
        hasCritical 
          ? "border-destructive bg-destructive/10" 
          : "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {hasCritical ? (
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 space-y-2">
          <AlertTitle className={cn(
            "font-medium",
            hasCritical ? "text-destructive" : "text-amber-700 dark:text-amber-400"
          )}>
            {hasCritical ? "Conflito de horário" : "Atenção"}
          </AlertTitle>
          
          <div className="space-y-1.5">
            {conflicts.map((conflict) => (
              <AlertDescription 
                key={conflict.id}
                className={cn(
                  "text-sm flex items-start gap-2",
                  conflict.severity === 'critical' 
                    ? "text-destructive" 
                    : "text-amber-700 dark:text-amber-400"
                )}
              >
                <span className="font-medium">⚠️ {conflict.message}</span>
                {conflict.details && (
                  <span className="text-muted-foreground">— {conflict.details}</span>
                )}
              </AlertDescription>
            ))}
          </div>
          
          {hasCritical && (
            <p className="text-xs text-muted-foreground mt-2">
              Não é possível salvar com conflitos críticos. Ajuste o horário.
            </p>
          )}
          
          {!hasCritical && (
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
              Administradores podem confirmar encaixes com conflitos de atenção.
            </p>
          )}
        </div>
      </div>
    </Alert>
  );
}
