import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f695b8ca770d93e4eed7a4/6336fe853_POWERLIFE-app-small.png';

export function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoUrl} alt="PowerLife" className="h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
            <Button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
          </Button>

          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-8">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
                <CardTitle className="text-3xl font-bold text-slate-900">Política de Privacidade</CardTitle>
              </div>
              <p className="text-slate-500">Sua privacidade e a segurança dos seus dados são nossa prioridade.</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none py-8 space-y-6 text-slate-600 leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">1. Coleta de Informações</h2>
                <p>
                  Coletamos informações que você nos fornece diretamente ao criar uma conta, como seu nome, endereço de e-mail e informações profissionais. Também coletamos dados sobre o uso da plataforma para fins de melhoria contínua.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">2. Uso dos Dados</h2>
                <p>
                  Os dados coletados são utilizados para fornecer, manter e melhorar nossos serviços, processar transações, enviar comunicações administrativas e garantir a segurança da plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">3. Proteção de Dados (LGPD)</h2>
                <p>
                  Em conformidade com a Lei Geral de Proteção de Dados (LGPD), implementamos medidas técnicas e organizacionais rigorosas para proteger seus dados pessoais contra acesso não autorizado, perda ou alteração.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">4. Compartilhamento de Informações</h2>
                <p>
                  Não vendemos nem alugamos seus dados pessoais a terceiros. O compartilhamento ocorre apenas com provedores de serviços essenciais (como hospedagem e processamento de pagamentos) ou por exigência legal.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">5. Seus Direitos</h2>
                <p>
                  Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de seus dados pessoais a qualquer momento através das configurações de sua conta ou entrando em contato conosco.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">6. Cookies</h2>
                <p>
                  Utilizamos cookies para melhorar sua experiência de navegação, lembrar suas preferências e analisar o tráfego do site. Você pode gerenciar as preferências de cookies através do seu navegador.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>

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
