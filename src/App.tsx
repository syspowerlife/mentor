import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';

// Pages placeholders
import { Home } from './pages/Home';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { RodaDaVida } from './pages/RodaDaVida';
import { AnaliseSwot } from './pages/AnaliseSwot';
import { MetaSmart } from './pages/MetaSmart';
import { PerfilDisc } from './pages/PerfilDisc';
import { ValoresPessoais } from './pages/ValoresPessoais';
import { MinhasAvaliacoes } from './pages/MinhasAvaliacoes';
import { Perfil } from './pages/Perfil';
import { Suporte } from './pages/Suporte';
import { Agendamentos } from './pages/Agendamentos';
import { AdminPanel } from './pages/AdminPanel';
import { Settings } from './pages/Settings';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { PortalLogin } from './pages/portal/PortalLogin';
import { PortalDashboard } from './pages/portal/PortalDashboard';
import { PortalEvaluations } from './pages/portal/PortalEvaluations';
import { PortalEvolution } from './pages/portal/PortalEvolution';
import { PortalAgendamentos } from './pages/portal/PortalAgendamentos';
import { Pricing } from './pages/Pricing';
import { PDIDashboard } from './pages/tools/pdi/PDIDashboard';
import { PDIDetail } from './pages/tools/pdi/PDIDetail';
import { PDIApproval } from './pages/tools/pdi/PDIApproval';
import { DiarioReflexao } from './pages/tools/DiarioReflexao';
import { AcompanhamentoProgresso } from './pages/tools/AcompanhamentoProgresso';
import { AvaliacaoCliente } from './pages/tools/AvaliacaoCliente';
import { NotificationsHistory } from './pages/NotificationsHistory';
import { Manuais } from './pages/ajuda/Manuais';
import { NotFound } from './pages/NotFound';
import { ServerError } from './pages/ServerError';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists but userData is null, it might be a new user being created
  // or a user that exists in Auth but not in Firestore.
  // We allow them in, but components should handle missing userData gracefully.
  
  return <>{children}</>;
}

function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/contato" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pricing" element={<Pricing />} />
              
              {/* Portal do Cliente */}
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/portal/dashboard" element={<PortalProtectedRoute><PortalDashboard /></PortalProtectedRoute>} />
              <Route path="/portal/avaliacoes" element={<PortalProtectedRoute><PortalEvaluations /></PortalProtectedRoute>} />
              <Route path="/portal/evolucao" element={<PortalProtectedRoute><PortalEvolution /></PortalProtectedRoute>} />
              <Route path="/portal/agendamentos" element={<PortalProtectedRoute><PortalAgendamentos /></PortalProtectedRoute>} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/Inicio" element={<Navigate to="/Dashboard" replace />} />
              <Route path="/Dashboard" element={<Dashboard />} />
              <Route path="/Clientes" element={<Clients />} />
              <Route path="/Clientes/:id" element={<ClientDetail />} />
              <Route path="/RodaDaVida" element={<RodaDaVida />} />
              <Route path="/AnaliseSwot" element={<AnaliseSwot />} />
              <Route path="/MetaSmart" element={<MetaSmart />} />
              <Route path="/PerfilDisc" element={<PerfilDisc />} />
              <Route path="/ValoresPessoais" element={<ValoresPessoais />} />
              <Route path="/MinhasAvaliacoes" element={<MinhasAvaliacoes />} />
              <Route path="/Perfil" element={<Perfil />} />
              <Route path="/Configuracoes" element={<Settings />} />
              <Route path="/Suporte" element={<Suporte />} />
              <Route path="/Agendamentos" element={<Agendamentos />} />
              <Route path="/AdminPanel" element={<AdminPanel />} />
              <Route path="/ferramentas/pdi" element={<PDIDashboard />} />
              <Route path="/ferramentas/pdi/:id" element={<PDIDetail />} />
              <Route path="/ferramentas/pdi/aprovacao" element={<PDIApproval />} />
              <Route path="/ferramentas/diario" element={<DiarioReflexao />} />
              <Route path="/ferramentas/progresso" element={<AcompanhamentoProgresso />} />
              <Route path="/ferramentas/avaliacao" element={<AvaliacaoCliente />} />
              <Route path="/notificacoes" element={<NotificationsHistory />} />
              <Route path="/ajuda/manuais" element={<Manuais />} />
            </Route>

            <Route path="/500" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
