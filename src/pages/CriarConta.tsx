import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const CriarConta = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const benefits = [
    "Agenda inteligente com confirmações",
    "Prontuário digital por especialidade",
    "Controle financeiro completo",
    "Suporte técnico incluso",
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ name, email, password });
    
    if (!validation.success) {
      toast({
        title: "Dados inválidos",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: name,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "Este email já está cadastrado. Tente fazer login.";
      }
      toast({
        title: "Erro ao criar conta",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada!",
      description: "Verifique seu email para confirmar o cadastro.",
    });
    navigate("/login");
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
            <span className="text-white font-display font-bold text-3xl">Y</span>
          </div>
          
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Comece grátis hoje
          </h2>
          <p className="text-white/80 mb-8">
            Crie sua conta e tenha acesso a todas as funcionalidades para gerenciar sua clínica.
          </p>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </Link>

          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-xl">Y</span>
              </div>
              <span className="font-display font-bold text-2xl text-foreground">
                Yesclin
              </span>
            </Link>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Crie sua conta
            </h1>
            <p className="text-muted-foreground">
              Comece a gerenciar sua clínica em minutos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar conta grátis"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Ao criar uma conta, você concorda com nossos{" "}
              <a href="#" className="text-primary hover:underline">Termos de Uso</a>
              {" "}e{" "}
              <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
            </p>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CriarConta;
