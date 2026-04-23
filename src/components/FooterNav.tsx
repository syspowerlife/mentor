import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Wrench, FileText, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';

export function FooterNav() {
  const location = useLocation();
  const current = location.pathname;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 flex justify-around items-center h-16 px-2 pb-safe">
      <NavIcon to="/Inicio" icon={<Home />} label="Início" isActive={current === '/Inicio' || current === '/'} />
      <NavIcon to="/Dashboard" icon={<LayoutDashboard />} label="Dashboard" isActive={current.startsWith('/Dashboard')} />
      
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center justify-center w-16 h-full text-slate-500 hover:text-blue-600">
            <div className="bg-blue-600 text-white p-3 rounded-full -mt-6 shadow-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium mt-1">Ferramentas</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 py-6">
          <SheetTitle className="text-center mb-4">Ferramentas</SheetTitle>
          <div className="grid grid-cols-2 gap-3">
            <ToolCard to="/RodaDaVida" label="Roda da Vida" color="bg-blue-50 text-blue-600" />
            <ToolCard to="/AnaliseSwot" label="Análise SWOT" color="bg-green-50 text-green-600" />
            <ToolCard to="/MetaSmart" label="Meta SMART" color="bg-purple-50 text-purple-600" />
            <ToolCard to="/PerfilDisc" label="Perfil DISC" color="bg-orange-50 text-orange-600" />
            <ToolCard to="/ValoresPessoais" label="Valores Pessoais" color="bg-indigo-50 text-indigo-600" className="col-span-2" />
          </div>
        </SheetContent>
      </Sheet>

      <NavIcon to="/MinhasAvaliacoes" icon={<FileText />} label="Avaliações" isActive={current.startsWith('/MinhasAvaliacoes')} />
      
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center justify-center w-16 h-full text-slate-500 hover:text-blue-600">
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[80vw] sm:w-[350px] p-0 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <SheetTitle>Menu</SheetTitle>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            <Link to="/Agendamentos" className="block p-3 rounded-lg bg-slate-50 font-medium">Agendamentos</Link>
            <Link to="/Perfil" className="block p-3 rounded-lg bg-slate-50 font-medium">Perfil</Link>
            <Link to="/Suporte" className="block p-3 rounded-lg bg-slate-50 font-medium">Suporte</Link>
            <Link to="/AdminPanel" className="block p-3 rounded-lg bg-slate-50 font-medium">Painel Admin</Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavIcon({ to, icon, label, isActive }: { to: string, icon: React.ReactNode, label: string, isActive: boolean }) {
  return (
    <Link to={to} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
      <div className={`mb-1 ${isActive ? 'scale-110 transition-transform' : ''}`}>
        {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-5 h-5' })}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

function ToolCard({ to, label, color, className = '' }: { to: string, label: string, color: string, className?: string }) {
  return (
    <Link to={to} className={`p-4 rounded-xl flex items-center justify-center text-center font-medium text-sm transition-transform active:scale-95 ${color} ${className}`}>
      {label}
    </Link>
  );
}
