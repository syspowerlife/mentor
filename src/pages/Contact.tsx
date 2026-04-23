import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f695b8ca770d93e4eed7a4/6336fe853_POWERLIFE-app-small.png';

export function Contact() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
    }, 1500);
  };

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
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
            <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
          </Button>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">Entre em Contato</h1>
                <p className="text-lg text-slate-600">
                  Tem alguma dúvida, sugestão ou precisa de ajuda técnica? Nossa equipe está pronta para te atender.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">E-mail</h3>
                    <p className="text-slate-500">suporte@powerlife.com</p>
                    <p className="text-xs text-slate-400 mt-1">Respondemos em até 24h úteis.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">WhatsApp</h3>
                    <p className="text-slate-500">(11) 99999-9999</p>
                    <p className="text-xs text-slate-400 mt-1">Atendimento de Seg. a Sex. das 9h às 18h.</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-white shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle>Envie uma mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input 
                      id="nome" 
                      placeholder="Seu nome" 
                      required 
                      value={formData.nome}
                      onChange={e => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail Profissional</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      required 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto</Label>
                    <Input 
                      id="assunto" 
                      placeholder="Como podemos ajudar?" 
                      required 
                      value={formData.assunto}
                      onChange={e => setFormData({...formData, assunto: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mensagem">Mensagem</Label>
                    <Textarea 
                      id="mensagem" 
                      placeholder="Descreva sua dúvida ou solicitação..." 
                      className="min-h-[120px]" 
                      required 
                      value={formData.mensagem}
                      onChange={e => setFormData({...formData, mensagem: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12" disabled={loading}>
                    {loading ? 'Enviando...' : (
                      <>
                        Enviar Mensagem <Send className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
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
