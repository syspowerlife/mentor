import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Zap, Shield, ChevronRight, BarChart2, MessageSquare, Calendar } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">PowerLife</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/pricing" className="hover:text-blue-600 transition-colors">Planos</Link>
          <Link to="/contato" className="hover:text-blue-600 transition-colors">Contato</Link>
          <Link to="/portal/login" className="hover:text-blue-600 transition-colors">Portal do Aluno</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-slate-600">Entrar</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-blue-600 hover:bg-blue-700">Começar Agora</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          <span>A primeira plataforma de Mentoring com IA do Brasil</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6">
          Potencialize seu Mentoring <br />
          <span className="text-blue-600">com Inteligência Real</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Acompanhe o progresso de seus mentorados com ferramentas profissionais, 
          diagnósticos precisos e insights gerados por IA.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-lg w-full">
              Iniciar Avaliação Grátis
            </Button>
          </Link>
          <Link to="/portal/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="h-14 px-8 border-slate-200 text-lg w-full">
              Acesso ao Portal
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ferramentas que transformam vidas</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Tudo o que você precisa para uma jornada de evolução completa em um só lugar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Activity, title: 'Roda da Vida', desc: 'Avalie o equilíbrio em 11 áreas fundamentais.' },
              { icon: Shield, title: 'Matriz SWOT', desc: 'Identifique riscos e oportunidades estratégicas.' },
              { icon: Target, title: 'Metas SMART', desc: 'Defina objetivos claros e acompanhe o progresso.' },
              { icon: MessageSquare, title: 'IA Mentor', desc: 'Insights estratégicos baseados em dados reais.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">PowerLife</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 PowerLife Mentoring System. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link to="/termos" className="hover:text-slate-600">Termos</Link>
            <Link to="/privacidade" className="hover:text-slate-600">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
