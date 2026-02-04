import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Mail, RefreshCcw } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Email inválido");

export default function ConfirmarEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialEmail = useMemo(() => params.get("email") ?? "", [params]);
  const [email, setEmail] = useState(initialEmail);
  const [isResending, setIsResending] = useState(false);

  // Se o usuário já confirmou e está autenticado, manda direto pro app.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) navigate("/app", { replace: true });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) navigate("/app", { replace: true });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const tips = [
    "Confira a caixa de entrada e a pasta de spam.",
    "Procure por um e-mail de verificação do Yesclin.",
    "O link pode demorar alguns minutos para chegar.",
  ];

  const handleResend = async () => {
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      toast({
        title: "Email inválido",
        description: parsed.error.issues[0]?.message ?? "Verifique o email informado.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
    });

    setIsResending(false);

    if (error) {
      const msg = error.message.toLowerCase().includes("rate")
        ? "Você solicitou o reenvio há pouco. Aguarde alguns minutos e tente novamente."
        : "Não foi possível reenviar agora. Tente novamente em instantes.";

      toast({
        title: "Falha ao reenviar",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "E-mail reenviado",
      description: "Se não aparecer, verifique também o spam.",
    });
  };

  return (
    <div className="min-h-screen hero-gradient flex">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
            <Mail className="text-white" size={28} />
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Confirme seu e-mail
          </h2>
          <p className="text-white/80 mb-8">
            Enviamos um link de verificação para você finalizar o cadastro e liberar o acesso.
          </p>

          <div className="space-y-4">
            {tips.map((tip, index) => (
              <motion.div
                key={tip}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
                <span className="text-white/90">{tip}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </Link>

          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-xl">Y</span>
              </div>
              <span className="font-display font-bold text-2xl text-foreground">Yesclin</span>
            </Link>

            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Falta só confirmar
            </h1>
            <p className="text-muted-foreground">
              Clique no link que enviamos para o seu e-mail para concluir o cadastro.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail usado no cadastro</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <Button
              type="button"
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCcw size={18} />
                {isResending ? "Reenviando…" : "Reenviar e-mail de confirmação"}
              </span>
            </Button>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>Dicas rápidas:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verifique spam/lixo eletrônico.</li>
                <li>Confirme se o e-mail está correto.</li>
                <li>Se reenviar não ajudar, aguarde alguns minutos e tente de novo.</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Já confirmou?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
