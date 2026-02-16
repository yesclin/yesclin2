import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Save, X, FileCheck, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProntuarioFooterBarProps {
  onCancel?: () => void;
  onSave?: () => void;
  onFinish?: () => void;
  saving?: boolean;
  finishing?: boolean;
  canEdit?: boolean;
  className?: string;
}

export function ProntuarioFooterBar({
  onCancel,
  onSave,
  onFinish,
  saving = false,
  finishing = false,
  canEdit = true,
  className,
}: ProntuarioFooterBarProps) {
  if (!canEdit) return null;

  return (
    <footer
      className={cn(
        "sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur shadow-[0_-2px_8px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        {/* Left: Cancel */}
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1.5" />
          Cancelar
        </Button>

        {/* Right: Save + Finish */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Salvar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" disabled={finishing} className="shadow-sm">
                {finishing ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4 mr-1.5" />
                )}
                Finalizar Atendimento
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar Atendimento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ao finalizar, o prontuário será bloqueado para edição (exceto para administradores).
                  Certifique-se de que todos os dados foram preenchidos corretamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onFinish}>
                  Confirmar Finalização
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </footer>
  );
}
