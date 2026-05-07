import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, LayoutDashboard, Wrench, Calendar, User, Users, FileText, HelpCircle, Settings, Menu, X, ChevronDown, ChevronRight, LogOut, Zap, BookOpen, MessageSquare } from 'lucide-react';
import { FooterNav } from './FooterNav';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import { NotificationCenter } from './NotificationCenter';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/badge';
import { OnboardingWizard } from './OnboardingWizard';
import { useAuth } from '@/lib/AuthContext';
import { logout } from '@/lib/firebase';
import { useDeadlineChecker } from '@/hooks/useDeadlineChecker';
import { UserRole, TipoUsuario } from '@/types/enums';

const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f695b8ca770d93e4eed7a4/6336fe853_POWERLIFE-app-small.png';

import { ApiStatusBanner } from './ApiStatusBanner';

import { usePlan } from '@/hooks/usePlan';
import { PlanType } from '@/types/enums';

export function Layout() {
  const { t } = useTranslation();
  const { user, userData, loading, isAdmin } = useAuth();
  const { plan, planType } = usePlan();
  const location = useLocation();
  
  // Initialize automatic deadline monitoring
  useDeadlineChecker();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <img src={logoUrl} alt="PowerLife" className="h-12 mb-4 opacity-50" />
          <div className="text-slate-400 font-medium">Carregando...</div>
        </div>
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/" replace />;
  }

  const displayName = userData?.name || user?.displayName || 'Usuário';
  const role = userData?.role || 'user';
  const photoUrl = userData?.photo_url || user?.photoURL;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col lg:flex-row">
      <OnboardingWizard />
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/50 shadow-sm fixed h-full z-30">
        <div className="p-6">
          <img id="sidebar-logo" src={logoUrl} alt="PowerLife" className="h-8 object-contain" />
        </div>
        <nav id="sidebar-nav" className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem to="/Dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label={t('menu.dashboard')} current={location.pathname} />
          <NavItem to="/Clientes" icon={<Users className="w-5 h-5" />} label={t('menu.clients')} current={location.pathname} />
          <NavItem to="/mensagens" icon={<MessageSquare className="w-5 h-5" />} label="Mensagens" current={location.pathname} />
          
          <Collapsible id="sidebar-tools" className="w-full">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5" />
                {t('menu.tools')}
              </div>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-10 pr-2 py-1 space-y-1">
              <NavItem to="/RodaDaVida" label={t('menu.roda_da_vida')} current={location.pathname} small />
              <NavItem to="/AnaliseSwot" label={t('menu.swot')} current={location.pathname} small />
              <NavItem to="/MetaSmart" label={t('menu.meta_smart')} current={location.pathname} small />
              <NavItem to="/PerfilDisc" label={t('menu.disc')} current={location.pathname} small />
              <NavItem to="/ValoresPessoais" label={t('menu.values')} current={location.pathname} small />
              <NavItem to="/ferramentas/pdi" label={t('menu.pdi')} current={location.pathname} small />
              {(userData?.role === UserRole.ADMIN || userData?.tipo_usuario === TipoUsuario.GESTOR) && (
                <NavItem to="/ferramentas/pdi/aprovacao" label="Aprovações de PDI" current={location.pathname} small />
              )}
              <NavItem to="/ferramentas/diario" label={t('menu.diary')} current={location.pathname} small />
              <NavItem to="/ferramentas/progresso" label={t('menu.progress')} current={location.pathname} small />
              <NavItem to="/ferramentas/avaliacao" label={t('menu.evaluation')} current={location.pathname} small />
            </CollapsibleContent>
          </Collapsible>

          <NavItem to="/Agendamentos" icon={<Calendar className="w-5 h-5" />} label={t('menu.appointments')} current={location.pathname} />
          <NavItem to="/MinhasAvaliacoes" icon={<FileText className="w-5 h-5" />} label={t('menu.my_evaluations')} current={location.pathname} />
          <NavItem to="/pricing" icon={<Zap className="w-5 h-5" />} label="Planos e Upgrade" current={location.pathname} />
          <NavItem to="/Perfil" icon={<User className="w-5 h-5" />} label={t('common.profile')} current={location.pathname} />
          <NavItem to="/Configuracoes" icon={<Settings className="w-5 h-5" />} label={t('common.settings')} current={location.pathname} />
          <NavItem to="/Suporte" icon={<HelpCircle className="w-5 h-5" />} label={t('menu.support')} current={location.pathname} />
          <NavItem to="/ajuda/manuais" icon={<BookOpen className="w-5 h-5" />} label={t('menu.manuals')} current={location.pathname} />
          
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-200">
              <NavItem to="/AdminPanel" icon={<Settings className="w-5 h-5" />} label={t('menu.admin')} current={location.pathname} />
            </div>
          )}
        </nav>

        {/* Plan Indicator */}
        {!isAdmin && (
          <div className="px-4 py-3 mx-4 mb-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Meu Plano</span>
              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 rounded-full font-bold ${
                planType === PlanType.MASTER ? 'bg-indigo-100 text-indigo-700' :
                planType === PlanType.PRO ? 'bg-blue-100 text-blue-700' :
                'bg-slate-200 text-slate-600'
              }`}>
                {plan?.name || 'Free'}
              </Badge>
            </div>
            {planType === PlanType.FREE && (
              <Link to="/pricing" className="block text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Fazer Upgrade
              </Link>
            )}
          </div>
        )}

        <div className="p-4 border-t border-slate-200">
          <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            {t('common.logout')}
          </Button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200/50 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="PowerLife" className="h-6 object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-[80vw] sm:w-[350px] p-0 flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <SheetTitle>
                <img src={logoUrl} alt="PowerLife" className="h-8 object-contain" />
              </SheetTitle>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              <NavItem to="/Dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label={t('menu.dashboard')} current={location.pathname} />
              <NavItem to="/Clientes" icon={<Users className="w-5 h-5" />} label={t('menu.clients')} current={location.pathname} />
              <NavItem to="/mensagens" icon={<MessageSquare className="w-5 h-5" />} label="Mensagens" current={location.pathname} />
              <div className="py-2">
                <div className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('menu.tools')}</div>
                <NavItem to="/RodaDaVida" label={t('menu.roda_da_vida')} current={location.pathname} small />
                <NavItem to="/AnaliseSwot" label={t('menu.swot')} current={location.pathname} small />
                <NavItem to="/MetaSmart" label={t('menu.meta_smart')} current={location.pathname} small />
                <NavItem to="/PerfilDisc" label={t('menu.disc')} current={location.pathname} small />
                <NavItem to="/ValoresPessoais" label={t('menu.values')} current={location.pathname} small />
                <NavItem to="/ferramentas/pdi" label={t('menu.pdi')} current={location.pathname} small />
                {(userData?.role === UserRole.ADMIN || userData?.tipo_usuario === TipoUsuario.GESTOR) && (
                  <NavItem to="/ferramentas/pdi/aprovacao" label="Aprovações de PDI" current={location.pathname} small />
                )}
                <NavItem to="/ferramentas/diario" label={t('menu.diary')} current={location.pathname} small />
                <NavItem to="/ferramentas/progresso" label={t('menu.progress')} current={location.pathname} small />
                <NavItem to="/ferramentas/avaliacao" label={t('menu.evaluation')} current={location.pathname} small />
              </div>
              <NavItem to="/Agendamentos" icon={<Calendar className="w-5 h-5" />} label={t('menu.appointments')} current={location.pathname} />
              <NavItem to="/MinhasAvaliacoes" icon={<FileText className="w-5 h-5" />} label={t('menu.my_evaluations')} current={location.pathname} />
              <NavItem to="/pricing" icon={<Zap className="w-5 h-5" />} label="Planos e Upgrade" current={location.pathname} />
              <NavItem to="/Perfil" icon={<User className="w-5 h-5" />} label={t('common.profile')} current={location.pathname} />
              <NavItem to="/Configuracoes" icon={<Settings className="w-5 h-5" />} label={t('common.settings')} current={location.pathname} />
              <NavItem to="/Suporte" icon={<HelpCircle className="w-5 h-5" />} label={t('menu.support')} current={location.pathname} />
              <NavItem to="/ajuda/manuais" icon={<BookOpen className="w-5 h-5" />} label={t('menu.manuals')} current={location.pathname} />
              
              {isAdmin && (
                <div className="pt-4 mt-4 border-t border-slate-200">
                  <NavItem to="/AdminPanel" icon={<Settings className="w-5 h-5" />} label={t('menu.admin')} current={location.pathname} />
                </div>
              )}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-3" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0 flex flex-col min-h-screen">
        {/* Top Header Desktop */}
        <header className="hidden lg:flex items-center justify-between px-8 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-500 capitalize">
              {location.pathname.split('/').pop()?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div id="header-notifications">
              <NotificationCenter />
            </div>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div id="header-user" className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{displayName}</p>
                <p className="text-[10px] text-slate-500 capitalize">{role}</p>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                <AvatarImage src={photoUrl} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col">
          <ApiStatusBanner />
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
        
        {/* Footer Desktop */}
        <footer className="hidden lg:block bg-white border-t border-slate-200/50 mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-4 gap-8">
              <div>
                <img src={logoUrl} alt="PowerLife" className="h-6 mb-4 object-contain opacity-80" />
                <p className="text-sm text-slate-500">Ferramentas profissionais para mentores e terapeutas.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Ferramentas</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><Link to="/RodaDaVida" className="hover:text-blue-600">Roda da Vida</Link></li>
                  <li><Link to="/AnaliseSwot" className="hover:text-blue-600">Análise SWOT</Link></li>
                  <li><Link to="/MetaSmart" className="hover:text-blue-600">Meta SMART</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Recursos</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><Link to="/Dashboard" className="hover:text-blue-600">Dashboard</Link></li>
                  <li><Link to="/MinhasAvaliacoes" className="hover:text-blue-600">Avaliações</Link></li>
                  <li><Link to="/Agendamentos" className="hover:text-blue-600">Agendamentos</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Suporte</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><Link to="/Suporte" className="hover:text-blue-600">Central de Ajuda</Link></li>
                  <li><Link to="/contato" className="hover:text-blue-600">Contato</Link></li>
                  <li><Link to="/termos" className="hover:text-blue-600">Termos de Uso</Link></li>
                  <li><Link to="/privacidade" className="hover:text-blue-600">Privacidade</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} PowerLife. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </main>

      {/* Footer Nav Mobile */}
      <FooterNav />
    </div>
  );
}

function NavItem({ to, icon, label, current, small = false }: { to: string, icon?: React.ReactNode, label: string, current: string, small?: boolean }) {
  const isActive = current === to || (to !== '/' && current.startsWith(to));
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
        small ? 'text-sm py-1.5' : 'text-sm font-medium'
      } ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {icon && <span className={isActive ? 'text-blue-600' : 'text-slate-500'}>{icon}</span>}
      {label}
    </Link>
  );
}
