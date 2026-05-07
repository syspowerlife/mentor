import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, Target, BarChart2, Users, FileText, 
  Shield, Zap, ArrowRight, Search, PlayCircle, 
  HelpCircle, CheckCircle2, MessageSquare, Video
} from 'lucide-react';

export function Manuais() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Central de Ajuda</h1>
            <p className="text-slate-500">Tudo o que você precisa saber para dominar o PowerLife.</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar ajuda..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="introducao" className="space-y-6">
        <TabsList className="bg-white/50 backdrop-blur-sm p-1 border border-slate-200 overflow-x-auto flex-nowrap justify-start h-auto w-full md:w-shrink">
          <TabsTrigger value="introducao" className="px-4 py-2">Introdução</TabsTrigger>
          <TabsTrigger value="videos" className="px-4 py-2 flex items-center gap-2">
            <Video className="w-4 h-4" /> Vídeos
          </TabsTrigger>
          <TabsTrigger value="ferramentas" className="px-4 py-2">Ferramentas</TabsTrigger>
          <TabsTrigger value="portal" className="px-4 py-2">Portal do Cliente</TabsTrigger>
          <TabsTrigger value="faq" className="px-4 py-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> FAQ
          </TabsTrigger>
        </TabsList>

        {/* Tab: Introducao */}
        <TabsContent value="introducao" className="space-y-6 outline-none">
          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Bem-vindo ao PowerLife
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                O PowerLife é uma plataforma completa projetada para mentores, coaches e terapeutas que buscam profissionalizar seu atendimento e escalar seus resultados.
              </p>
              <h3 className="text-lg font-bold mt-6 mb-2">Primeiros Passos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <StepItem 
                  number="1" 
                  title="Complete seu Perfil" 
                  desc="Adicione sua foto, especialidade e biografia em seu perfil." 
                />
                <StepItem 
                  number="2" 
                  title="Cadastre seu primeiro Cliente" 
                  desc="Vá em Clientes e adicione as informações básicas." 
                />
                <StepItem 
                  number="3" 
                  title="Realize uma Avaliação" 
                  desc="Escolha uma ferramenta (ex: Roda da Vida) e aplique." 
                />
                <StepItem 
                  number="4" 
                  title="Defina Metas SMART" 
                  desc="Crie objetivos claros e prazos para seu mentorado." 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Videos */}
        <TabsContent value="videos" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <VideoCard 
              title="Tour Geral da Plataforma"
              duration="5:20"
              thumbnail="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60"
              category="Introdução"
            />
            <VideoCard 
              title="Como Gerenciar Clientes"
              duration="3:45"
              thumbnail="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60"
              category="Gestão"
            />
            <VideoCard 
              title="Aplicando a Roda da Vida"
              duration="8:12"
              thumbnail="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60"
              category="Ferramentas"
            />
            <VideoCard 
              title="Configurando o Portal do Cliente"
              duration="4:30"
              thumbnail="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop&q=60"
              category="Portal"
            />
            <VideoCard 
              title="Análise DISC na Prática"
              duration="12:15"
              thumbnail="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60"
              category="Perfil Comportamental"
            />
            <VideoCard 
              title="Gestão de PDI e Metas"
              duration="6:50"
              thumbnail="https://images.unsplash.com/photo-1454165833011-297404af0c18?w=800&auto=format&fit=crop&q=60"
              category="Ferramentas"
            />
          </div>
        </TabsContent>

        {/* Tab: Ferramentas */}
        <TabsContent value="ferramentas" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GuideCard 
              icon={<Target className="w-5 h-5 text-red-500" />}
              title="Roda da Vida"
              description="Avaliação sistêmica de 12 áreas da vida. Ideal para o início do processo."
              steps={[
                "O cliente pontua de 1 a 10 cada área.",
                "Analise o equilíbrio entre as notas.",
                "Identifique a área alavanca de mudança."
              ]}
            />
            <GuideCard 
              icon={<BarChart2 className="w-5 h-5 text-blue-500" />}
              title="Análise SWOT"
              description="Mapeamento de Forças, Fraquezas, Oportunidades e Ameaças."
              steps={[
                "Liste fatores internos (F e F).",
                "Liste fatores externos (O e A).",
                "Trace planos para cruzar os dados."
              ]}
            />
            <GuideCard 
              icon={<Shield className="w-5 h-5 text-purple-500" />}
              title="Perfil DISC"
              description="Análise comportamental: Dominância, Influência, Estabilidade e Conformidade."
              steps={[
                "Envie o teste para o cliente responder.",
                "O sistema mapeia o estilo dominante.",
                "Ajuste sua mentoria ao perfil dele."
              ]}
            />
            <GuideCard 
              icon={<Zap className="w-5 h-5 text-green-500" />}
              title="Metas SMART"
              description="Objetivos específicos, mensuráveis, atingíveis, relevantes e temporais."
              steps={[
                "Defina o objetivo principal claramente.",
                "Estabeleça indicadores de sucesso.",
                "Coloque uma data limite real."
              ]}
            />
          </div>
        </TabsContent>

        {/* Tab: Portal */}
        <TabsContent value="portal" className="space-y-6 outline-none">
          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Experiência do Mentorado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <p className="text-slate-600">
                    O Portal do Cliente é um ambiente seguro onde seu mentorado pode:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">Responder avaliações enviadas por você.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">Acompanhar o progresso de suas metas.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">Registrar insights no Diário de Reflexão.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">Visualizar agendamentos de sessões.</span>
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-1/3 bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col items-center text-center">
                  <MessageSquare className="w-10 h-10 text-indigo-600 mb-4" />
                  <h4 className="font-bold text-indigo-900 mb-2">Habilite o Acesso</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Vá em Clientes {'>'} Selecione o Cliente {'>'} Dados de Acesso para configurar o usuário e senha do seu mentorado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: FAQ */}
        <TabsContent value="faq" className="space-y-6 outline-none">
          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Perguntas Frequentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-slate-100">
                  <AccordionTrigger className="text-slate-700 hover:no-underline font-semibold">Como convidar meu cliente para o portal?</AccordionTrigger>
                  <AccordionContent className="text-slate-500">
                    Dentro do detalhe de cada cliente, existe uma aba chamada "Dados de Acesso". Lá você define o usuário e senha (ou o sistema gera um) e compartilha com seu mentorado. Breve teremos convite automático por e-mail.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-slate-100">
                  <AccordionTrigger className="text-slate-700 hover:no-underline font-semibold">O PowerLife sincroniza com o Google Calendar?</AccordionTrigger>
                  <AccordionContent className="text-slate-500">
                    Sim! Em Configurações, você pode conectar sua conta Google. Seus agendamentos no PowerLife aparecerão no seu Google Calendar e vice-versa (se configurado).
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-slate-100">
                  <AccordionTrigger className="text-slate-700 hover:no-underline font-semibold">Como exportar os dados do meu cliente?</AccordionTrigger>
                  <AccordionContent className="text-slate-500">
                    Você pode exportar cada avaliação individualmente como PDF. No detalhe do cliente e no Painel Admin, utilize o botão "Exportar PDF" para gerar o Dossiê Consolidado, que reúne todos os resultados, metas e evolução em um único documento profissional.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-slate-100">
                  <AccordionTrigger className="text-slate-700 hover:no-underline font-semibold">Existe um limite de clientes por plano?</AccordionTrigger>
                  <AccordionContent className="text-slate-500">
                    Sim, cada plano possui um limite de clientes ativos e armazenamento de arquivos. Você pode conferir os detalhes na página de "Planos e Upgrade".
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Support CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-100/50">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold">Não encontrou o que procurava?</h3>
          <p className="text-blue-100">
            Fale com nosso suporte humanizado. Respondemos em até 24h.
          </p>
        </div>
        <a 
          href="/Suporte" 
          className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"
        >
          Contatar Suporte <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function StepItem({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white/40 ring-1 ring-slate-200/50">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function VideoCard({ title, duration, thumbnail, category }: { title: string, duration: string, thumbnail: string, category: string }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow group">
      <div className="relative aspect-video overflow-hidden cursor-pointer">
        <img 
          src={thumbnail} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-white transition-colors" />
        </div>
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
          {duration}
        </div>
      </div>
      <CardContent className="p-4">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{category}</span>
        <h4 className="font-bold text-slate-800 mt-1 line-clamp-1">{title}</h4>
      </CardContent>
    </Card>
  );
}

function GuideCard({ icon, title, description, steps }: { icon: React.ReactNode, title: string, description: string, steps: string[] }) {
  return (
    <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Como aplicar:</h4>
          <ul className="space-y-1.5">
            {steps.map((step, i) => (
              <li key={i} className="text-xs text-slate-600 flex gap-2">
                <span className="text-blue-500 font-bold">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
