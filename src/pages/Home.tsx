import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { PricingSection } from '@/components/PricingSection';

const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f695b8ca770d93e4eed7a4/6336fe853_POWERLIFE-app-small.png';

export function Home() {
  const navigate = useNavigate();

  const handleFooterLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, pageName: string) => {
    e.preventDefault();
    toast.info(`A página de ${pageName} estará disponível em breve!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="PowerLife" className="h-8" />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
            <Button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
          Transforme seus atendimentos com <span className="text-blue-600">PowerLife</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          A plataforma definitiva para mentores e terapeutas. Estruture sessões, acompanhe a evolução dos seus clientes e tome decisões baseadas em dados.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/register')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-lg h-14 px-8">
            Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8">
            Ver Demonstração
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Abandone planilhas e ferramentas fragmentadas. O PowerLife centraliza toda a jornada do seu cliente.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-blue-600" />}
              title="Gestão de Clientes"
              description="Histórico completo, anotações de sessões e acompanhamento individualizado de cada cliente."
            />
            <FeatureCard 
              icon={<Target className="w-8 h-8 text-indigo-600" />}
              title="Metas SMART & Kanban"
              description="Defina e acompanhe metas estruturadas com um quadro Kanban visual e intuitivo."
            />
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8 text-teal-600" />}
              title="Avaliações e Progresso"
              description="Aplique a Roda da Vida, Análise SWOT, Perfil DISC e visualize a evolução em gráficos."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Planos simples e transparentes</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Escolha o plano ideal para o seu momento profissional.</p>
          </div>
          <PricingSection />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <img src={logoUrl} alt="PowerLife" className="h-8 mb-6 opacity-50 grayscale" />
          <p className="mb-6">Ferramentas profissionais para mentores e terapeutas.</p>
          <div className="flex gap-6 mb-8 text-sm">
            <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link to="/contato" className="hover:text-white transition-colors">Contato</Link>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} PowerLife. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
      <div className="mb-6 bg-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ title, price, period, features, buttonText, highlighted = false, onClick, disabled }: any) {
  return (
    <div className={`p-8 rounded-3xl border ${highlighted ? 'bg-slate-900 text-white border-slate-800 shadow-xl relative' : 'bg-white text-slate-900 border-slate-200'}`}>
      {highlighted && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">MAIS POPULAR</div>}
      <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className={highlighted ? 'text-slate-400' : 'text-slate-500'}>{period}</span>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center gap-3">
            <CheckCircle2 className={`w-5 h-5 ${highlighted ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={highlighted ? 'text-slate-300' : 'text-slate-600'}>{feature}</span>
          </li>
        ))}
      </ul>
      <Button onClick={onClick} disabled={disabled} className={`w-full h-12 text-lg ${highlighted ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>
        {buttonText}
      </Button>
    </div>
  );
}
