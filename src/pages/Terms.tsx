import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f695b8ca770d93e4eed7a4/6336fe853_POWERLIFE-app-small.png';

export function Terms() {
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
              <CardTitle className="text-3xl font-bold text-slate-900">Termos de Uso</CardTitle>
              <p className="text-slate-500 mt-2">Última atualização: 14 de abril de 2026</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none py-8 space-y-6 text-slate-600 leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">1. Aceitação dos Termos</h2>
                <p>
                  Ao acessar e utilizar a plataforma PowerLife, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">2. Descrição do Serviço</h2>
                <p>
                  O PowerLife é uma plataforma SaaS (Software as a Service) projetada para auxiliar mentores, coaches e terapeutas na gestão de seus atendimentos, acompanhamento de metas e aplicação de ferramentas de desenvolvimento humano.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">3. Responsabilidades do Usuário</h2>
                <p>
                  Você é responsável por manter a confidencialidade de sua conta e senha, bem como por todas as atividades que ocorram sob sua conta. Você concorda em fornecer informações precisas e completas durante o processo de registro.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">4. Propriedade Intelectual</h2>
                <p>
                  Todo o conteúdo, design, logotipos e funcionalidades da plataforma são de propriedade exclusiva do PowerLife ou de seus licenciadores e estão protegidos por leis de direitos autorais e propriedade intelectual.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">5. Limitação de Responsabilidade</h2>
                <p>
                  O PowerLife fornece as ferramentas, mas não é responsável pelo conteúdo das sessões de mentoria ou pelos conselhos profissionais fornecidos pelos usuários aos seus clientes. O uso da plataforma é por sua conta e risco.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3">6. Modificações nos Termos</h2>
                <p>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas aos usuários através da plataforma ou por e-mail.
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
