import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Target, BarChart2, Users, FileText, Shield, Zap, ArrowRight } from 'lucide-react';

export function Manuais() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manuais e Guias</h1>
          <p className="text-slate-500">Tudo o que você precisa saber para dominar o PowerLife.</p>
        </div>
      </div>

      <Tabs defaultValue="introducao" className="space-y-6">
        <TabsList className="bg-white/50 backdrop-blur-sm p-1 border border-slate-200 overflow-x-auto flex-nowrap justify-start md:justify-center h-auto">
          <TabsTrigger value="introducao" className="px-4 py-2">Introdução</TabsTrigger>
          <TabsTrigger value="ferramentas" className="px-4 py-2">Ferramentas</TabsTrigger>
          <TabsTrigger value="gestao" className="px-4 py-2">Gestão de Clientes</TabsTrigger>
          <TabsTrigger value="portal" className="px-4 py-2">Portal do Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="introducao" className="space-y-6">
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
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Complete seu Perfil:</strong> Adicione sua foto, especialidade e biografia em Configurações.</li>
                <li><strong>Cadastre seu primeiro Cliente:</strong> Vá em "Clientes" e adicione as informações básicas.</li>
                <li><strong>Realize uma Avaliação:</strong> Escolha uma ferramenta (ex: Roda da Vida) e aplique com seu cliente.</li>
                <li><strong>Acompanhe o Progresso:</strong> Use o Dashboard para ter uma visão geral da evolução de todos os seus mentorados.</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ferramentas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GuideCard 
              icon={<Target className="w-5 h-5 text-red-500" />}
              title="Roda da Vida"
              description="Avaliação sistêmica de 12 áreas da vida. Ideal para o início do processo de mentoria."
              steps={[
                "Peça ao cliente para dar uma nota de 1 a 10 para cada área.",
                "Analise o equilíbrio (ou falta dele) entre as áreas.",
                "Identifique a 'Área Alavanca' que, se melhorada, impactará as outras."
              ]}
            />
            <GuideCard 
              icon={<BarChart2 className="w-5 h-5 text-blue-500" />}
              title="Análise SWOT"
              description="Identificação de Forças, Fraquezas, Oportunidades e Ameaças."
              steps={[
                "Liste os fatores internos (Forças e Fraquezas).",
                "Liste os fatores externos (Oportunidades e Ameaças).",
                "Crie um Plano de Ação para potencializar forças e mitigar fraquezas."
              ]}
            />
            <GuideCard 
              icon={<Shield className="w-5 h-5 text-purple-500" />}
              title="Perfil DISC"
              description="Mapeamento de perfil comportamental baseado em Dominância, Influência, Estabilidade e Conformidade."
              steps={[
                "O cliente responde ao questionário de 28 questões.",
                "O sistema gera o gráfico de perfil dominante.",
                "Use o resultado para adaptar sua comunicação ao estilo do cliente."
              ]}
            />
            <GuideCard 
              icon={<Zap className="w-5 h-5 text-green-500" />}
              title="Metas SMART"
              description="Transforme desejos em objetivos concretos e mensuráveis."
              steps={[
                "Específica: O que exatamente você quer?",
                "Mensurável: Como saberemos que foi atingido?",
                "Atingível: É realista com os recursos atuais?",
                "Relevante: Por que isso é importante agora?",
                "Temporal: Qual o prazo final?"
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="gestao" className="space-y-6">
          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Gestão Eficiente de Mentorados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-1">Dica de Ouro</h4>
                <p className="text-sm text-blue-700">
                  Mantenha o histórico de sessões sempre atualizado. Isso permite que você e o cliente visualizem a evolução de longo prazo, aumentando a percepção de valor do seu trabalho.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold">Funcionalidades Principais:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Anotações Privadas:</strong> Registre percepções que só você pode ver.</li>
                  <li><strong>Anexos:</strong> Centralize contratos, exercícios e materiais de apoio.</li>
                  <li><strong>Agendamentos:</strong> Sincronize com o Google Calendar para evitar conflitos.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portal" className="space-y-6">
          <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                O Portal do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                O Portal do Cliente é o espaço exclusivo onde seu mentorado interage com o processo.
              </p>
              <ul className="space-y-2">
                <li><strong>Acesso:</strong> Você habilita o acesso nas configurações do cliente.</li>
                <li><strong>Interação:</strong> O cliente pode responder avaliações, ver metas e registrar no Diário de Reflexão.</li>
                <li><strong>Engajamento:</strong> O sistema envia notificações automáticas para manter o cliente focado nas tarefas.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-100">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold">Ainda tem dúvidas?</h3>
          <p className="text-blue-100">Nossa equipe de suporte está pronta para te ajudar.</p>
        </div>
        <a 
          href="/Suporte" 
          className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
        >
          Ir para Suporte <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function GuideCard({ icon, title, description, steps }: { icon: React.ReactNode, title: string, description: string, steps: string[] }) {
  return (
    <Card className="border-none shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Como aplicar:</h4>
          <ul className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
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
