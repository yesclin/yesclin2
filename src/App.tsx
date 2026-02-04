import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { RequireAuth } from "@/components/app/RequireAuth";

// Páginas Públicas
import Index from "./pages/Index";
import Login from "./pages/Login";
import CriarConta from "./pages/CriarConta";
import RecuperarSenha from "./pages/RecuperarSenha";
import AceitarConvite from "./pages/AceitarConvite";

import NotFound from "./pages/NotFound";

// Layout do App
import { AppLayout } from "./components/app/AppLayout";

// Páginas do App
import Dashboard from "./pages/app/Dashboard";
import Agenda from "./pages/app/Agenda";
import Prontuario from "./pages/app/Prontuario";
import Pacientes from "./pages/app/Pacientes";
import Convenios from "./pages/app/gestao/Convenios";
import Marketing from "./pages/app/Comunicacao";
import MeuFinanceiro from "./pages/app/MeuFinanceiro";
import Atendimento from "./pages/app/Atendimento";

// Gestão
import Financas from "./pages/app/gestao/Financas";
import Estoque from "./pages/app/gestao/Estoque";
import Relatorios from "./pages/app/gestao/Relatorios";

// Configurações
import ConfigProcedimentos from "./pages/app/config/Procedimentos";
import ConfigClinica from "./pages/app/config/Clinica";
import ConfigUsuarios from "./pages/app/config/Usuarios";
import ConfigMateriais from "./pages/app/config/Materiais";
import ConfigAgenda from "./pages/app/config/Agenda";
import ConfigAtendimento from "./pages/app/config/Atendimento";
import ConfigProntuario from "./pages/app/config/Prontuario";
import ConfigSeguranca from "./pages/app/config/Seguranca";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PermissionsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Páginas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/criar-conta" element={<CriarConta />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          
          <Route path="/aceitar-convite" element={<AceitarConvite />} />
          
          {/* Área do App (protegida) */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="prontuario" element={<Prontuario />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="gestao/convenios" element={<Convenios />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="meu-financeiro" element={<MeuFinanceiro />} />
            <Route path="atendimento" element={<Atendimento />} />
            
            {/* Gestão */}
            <Route path="gestao/financas" element={<Financas />} />
            <Route path="gestao/estoque" element={<Estoque />} />
            <Route path="gestao/relatorios" element={<Relatorios />} />
            
            {/* Configurações */}
            <Route path="config/procedimentos" element={<ConfigProcedimentos />} />
            <Route path="config/clinica" element={<ConfigClinica />} />
            <Route path="config/usuarios" element={<ConfigUsuarios />} />
            <Route path="config/materiais" element={<ConfigMateriais />} />
            <Route path="config/agenda" element={<ConfigAgenda />} />
            <Route path="config/atendimento" element={<ConfigAtendimento />} />
            <Route path="config/prontuario" element={<ConfigProntuario />} />
            <Route path="config/seguranca" element={<ConfigSeguranca />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </PermissionsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
