import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Target, 
  TrendingUp, 
  Users, 
  Star,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// Import tool components (we'll need to adapt them or create simplified versions)
// For now, let's list them and then implement the logic for each.

const TOOLS = [
  { id: 'roda', name: 'Roda da Vida', icon: TrendingUp, description: 'Avalie o equilíbrio das áreas da sua vida', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'swot', name: 'Análise SWOT', icon: Target, description: 'Identifique Forças, Fraquezas, Oportunidades e Ameaças', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'disc', name: 'Perfil DISC', icon: Users, description: 'Descubra seu perfil comportamental predominante', color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 'valores', name: 'Valores Pessoais', icon: Star, description: 'Identifique seus valores fundamentais', color: 'text-purple-600', bg: 'bg-purple-50' },
];

export function PortalEvaluations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchCliente = async () => {
      try {
        const q = query(collection(db, 'clientes'), where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setCliente({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        }
        setIsLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'portal_evaluations');
        setIsLoading(false);
      }
    };

    fetchCliente();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Acesso não vinculado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/portal/dashboard')} variant="outline" className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => selectedTool ? setSelectedTool(null) : navigate('/portal/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-bold text-xl text-slate-800">
            {selectedTool ? TOOLS.find(t => t.id === selectedTool)?.name : 'Avaliações'}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!selectedTool ? (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Escolha uma ferramenta</h1>
              <p className="text-slate-500">Selecione a avaliação que deseja realizar agora.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TOOLS.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="hover:border-blue-300 transition-all cursor-pointer group"
                  onClick={() => setSelectedTool(tool.id)}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${tool.bg} ${tool.color} group-hover:bg-blue-600 group-hover:text-white transition-colors`}>
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{tool.name}</h4>
                      <p className="text-xs text-slate-500">{tool.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedTool === 'roda' && <RodaDaVidaForm clienteId={cliente.id} onSuccess={() => setSelectedTool(null)} />}
            {selectedTool === 'swot' && <SwotForm clienteId={cliente.id} onSuccess={() => setSelectedTool(null)} />}
            {selectedTool === 'disc' && <DiscForm clienteId={cliente.id} onSuccess={() => setSelectedTool(null)} />}
            {selectedTool === 'valores' && <ValoresForm clienteId={cliente.id} onSuccess={() => setSelectedTool(null)} />}
          </div>
        )}
      </main>
    </div>
  );
}

// Simplified Form Components for the Portal

function RodaDaVidaForm({ clienteId, onSuccess }: { clienteId: string, onSuccess: () => void }) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('Minha Roda da Vida');
  const [isSaving, setIsSaving] = useState(false);
  const [valores, setValores] = useState<Record<string, number>>({
    saude_fisica: 5, desenvolvimento_mental: 5, inteligencia_emocional: 5,
    familia: 5, romance: 5, vida_social: 5, carreira: 5, financas: 5,
    contribuicao_social: 5, divertimento_lazer: 5, saude_ambiente: 5
  });

  const AREAS = [
    { id: 'saude_fisica', label: 'Saúde Física' },
    { id: 'desenvolvimento_mental', label: 'Desenvolvimento Mental' },
    { id: 'inteligencia_emocional', label: 'Inteligência Emocional' },
    { id: 'familia', label: 'Família' },
    { id: 'romance', label: 'Romance' },
    { id: 'vida_social', label: 'Vida Social' },
    { id: 'carreira', label: 'Carreira' },
    { id: 'financas', label: 'Finanças' },
    { id: 'contribuicao_social', label: 'Contribuição Social' },
    { id: 'divertimento_lazer', label: 'Diversão/Lazer' },
    { id: 'saude_ambiente', label: 'Saúde do Ambiente' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'rodas_da_vida'), {
        titulo,
        ...valores,
        created_by: user?.uid,
        cliente_id: clienteId,
        created_date: new Date().toISOString(),
        tipo_avaliacao: 'atual'
      });
      toast.success('Roda da Vida salva com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar avaliação.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avalie seu momento atual</CardTitle>
        <CardDescription>Dê uma nota de 0 a 10 para cada área da sua vida.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AREAS.map((area) => (
            <div key={area.id} className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">{area.label}</label>
                <span className="text-sm font-bold text-blue-600">{valores[area.id]}</span>
              </div>
              <input 
                type="range" 
                min="0" max="10" step="1" 
                value={valores[area.id]} 
                onChange={(e) => setValores({...valores, [area.id]: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Salvar Avaliação
        </Button>
      </CardContent>
    </Card>
  );
}

function SwotForm({ clienteId, onSuccess }: { clienteId: string, onSuccess: () => void }) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [swotData, setSwotData] = useState({
    forcas: '',
    fraquezas: '',
    oportunidades: '',
    ameacas: ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Split by line breaks, trim spaces, and remove empty lines
      const parseItems = (text: string) => text.split('\n').map(i => i.trim()).filter(i => i.length > 0);
      
      const payload = {
        forcas: parseItems(swotData.forcas),
        fraquezas: parseItems(swotData.fraquezas),
        oportunidades: parseItems(swotData.oportunidades),
        ameacas: parseItems(swotData.ameacas),
        cliente_id: clienteId,
        created_by: user?.uid,
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'analises_swot'), payload);
      toast.success('Análise SWOT salva com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar Análise SWOT.');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = 
    swotData.forcas.trim() !== '' || 
    swotData.fraquezas.trim() !== '' || 
    swotData.oportunidades.trim() !== '' || 
    swotData.ameacas.trim() !== '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Análise SWOT (Matriz FOFA)</CardTitle>
        <CardDescription>
          Preencha os quadrantes abaixo. Separe cada item usando uma <strong>nova linha (Enter)</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Forças (Strengths) */}
          <div className="space-y-2 border-t-4 border-emerald-500 bg-emerald-50/50 p-4 rounded-b-xl shadow-sm">
            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Forças (Fatores Internos)
            </h3>
            <p className="text-xs text-emerald-700/80 mb-2">O que você faz bem? Quais são seus talentos, vantagens e diferenciais?</p>
            <textarea 
              rows={4}
              placeholder="Ex:\nBoa comunicação\nResiliência"
              className="w-full text-sm p-3 border-emerald-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              value={swotData.forcas}
              onChange={(e) => setSwotData({...swotData, forcas: e.target.value})}
            />
          </div>

          {/* Fraquezas (Weaknesses) */}
          <div className="space-y-2 border-t-4 border-red-500 bg-red-50/50 p-4 rounded-b-xl shadow-sm">
            <h3 className="font-bold text-red-800 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Fraquezas (Fatores Internos)
            </h3>
            <p className="text-xs text-red-700/80 mb-2">O que precisa melhorar? Quais habilidades ou recursos estão faltando?</p>
            <textarea 
              rows={4}
              placeholder="Ex:\nFalta de fluência em inglês\nDesorganização com horários"
              className="w-full text-sm p-3 border-red-200 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white"
              value={swotData.fraquezas}
              onChange={(e) => setSwotData({...swotData, fraquezas: e.target.value})}
            />
          </div>

          {/* Oportunidades (Opportunities) */}
          <div className="space-y-2 border-t-4 border-blue-500 bg-blue-50/50 p-4 rounded-b-xl shadow-sm">
            <h3 className="font-bold text-blue-800 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Oportunidades (Fatores Externos)
            </h3>
            <p className="text-xs text-blue-700/80 mb-2">Quais cenários, tendências ou contatos você pode aproveitar a seu favor?</p>
            <textarea 
              rows={4}
              placeholder="Ex:\nMercado em expansão\nPossibilidade de promoção"
              className="w-full text-sm p-3 border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={swotData.oportunidades}
              onChange={(e) => setSwotData({...swotData, oportunidades: e.target.value})}
            />
          </div>

          {/* Ameaças (Threats) */}
          <div className="space-y-2 border-t-4 border-slate-700 bg-slate-50 p-4 rounded-b-xl shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Ameaças (Fatores Externos)
            </h3>
            <p className="text-xs text-slate-600/80 mb-2">Quais obstáculos, competidores ou mudanças podem prejudicar seu objetivo?</p>
            <textarea 
              rows={4}
              placeholder="Ex:\nCrise econômica\nNovos concorrentes no mercado"
              className="w-full text-sm p-3 border-slate-300 rounded-lg focus:ring-slate-500 focus:border-slate-500 bg-white"
              value={swotData.ameacas}
              onChange={(e) => setSwotData({...swotData, ameacas: e.target.value})}
            />
          </div>

        </div>

        <Button 
          onClick={handleSave} 
          disabled={!isFormValid || isSaving} 
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Salvar Análise SWOT
        </Button>
      </CardContent>
    </Card>
  );
}

function DiscForm({ clienteId, onSuccess }: { clienteId: string, onSuccess: () => void }) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { most: string, least: string }>>({});

  const DISC_QUESTIONS = [
    {
      id: 1,
      options: [
        { id: 'D', label: 'Decidido, focado em resultados' },
        { id: 'I', label: 'Entusiasta, comunicativo' },
        { id: 'S', label: 'Paciente, bom ouvinte' },
        { id: 'C', label: 'Analítico, atento a detalhes' }
      ]
    },
    {
      id: 2,
      options: [
        { id: 'D', label: 'Competitivo, gosta de desafios' },
        { id: 'I', label: 'Persuasivo, gosta de influenciar' },
        { id: 'S', label: 'Estável, evita mudanças bruscas' },
        { id: 'C', label: 'Sistemático, segue regras' }
      ]
    },
    {
      id: 3,
      options: [
        { id: 'D', label: 'Direto, vai direto ao ponto' },
        { id: 'I', label: 'Otimista, vê o lado bom' },
        { id: 'S', label: 'Gentil, prestativo' },
        { id: 'C', label: 'Preciso, busca a perfeição' }
      ]
    },
    {
      id: 4,
      options: [
        { id: 'D', label: 'Ousado, assume riscos' },
        { id: 'I', label: 'Popular, gosta de estar entre pessoas' },
        { id: 'S', label: 'Leal, valoriza relacionamentos' },
        { id: 'C', label: 'Lógico, baseia-se em fatos' }
      ]
    },
    {
      id: 5,
      options: [
        { id: 'D', label: 'Independente, age por conta própria' },
        { id: 'I', label: 'Animado, contagia os outros' },
        { id: 'S', label: 'Calmo, mantém o equilíbrio' },
        { id: 'C', label: 'Cuidadoso, evita erros' }
      ]
    },
    {
      id: 6,
      options: [
        { id: 'D', label: 'Autoconfiante, acredita no seu potencial' },
        { id: 'I', label: 'Sociável, faz amigos facilmente' },
        { id: 'S', label: 'Amigável, acolhedor' },
        { id: 'C', label: 'Organizado, mantém tudo em ordem' }
      ]
    },
    {
      id: 7,
      options: [
        { id: 'D', label: 'Forte, não desiste fácil' },
        { id: 'I', label: 'Expressivo, demonstra emoções' },
        { id: 'S', label: 'Cooperativo, trabalha bem em equipe' },
        { id: 'C', label: 'Perfeccionista, foca na qualidade' }
      ]
    },
    {
      id: 8,
      options: [
        { id: 'D', label: 'Rápido, gosta de agilidade' },
        { id: 'I', label: 'Charmoso, capta a atenção' },
        { id: 'S', label: 'Metódico, prefere rotina' },
        { id: 'C', label: 'Disciplinado, cumpre prazos' }
      ]
    },
    {
      id: 9,
      options: [
        { id: 'D', label: 'Vigoroso, tem muita energia' },
        { id: 'I', label: 'Inspirador, motiva os outros' },
        { id: 'S', label: 'Confiável, cumpre o que promete' },
        { id: 'C', label: 'Racional, pensa antes de agir' }
      ]
    },
    {
      id: 10,
      options: [
        { id: 'D', label: 'Questionador, busca o porquê' },
        { id: 'I', label: 'Descontraído, prefere ambiente leve' },
        { id: 'S', label: 'Previsível, gosta de segurança' },
        { id: 'C', label: 'Cauteloso, avalia os riscos' }
      ]
    }
  ];

  const handleSelect = (optionId: string, type: 'most' | 'least') => {
    const currentAnswers = answers[currentStep] || { most: '', least: '' };
    
    // Prevent selecting the same for most and least
    if (type === 'most' && currentAnswers.least === optionId) {
      setAnswers({ ...answers, [currentStep]: { most: optionId, least: '' } });
    } else if (type === 'least' && currentAnswers.most === optionId) {
      setAnswers({ ...answers, [currentStep]: { most: '', least: optionId } });
    } else {
      setAnswers({ ...answers, [currentStep]: { ...currentAnswers, [type]: optionId } });
    }
  };

  const calculateResults = () => {
    const totals = { D: 0, I: 0, S: 0, C: 0 };
    Object.values(answers).forEach(ans => {
      if (ans.most) totals[ans.most as keyof typeof totals] += 2;
      if (ans.least) totals[ans.least as keyof typeof totals] -= 1;
    });

    // Normalize to 0-100 (Max points approx 10 * 2 = 20, Min -10)
    // Adjusted normalization: (score + 10) / 30 * 100
    const normalize = (val: number) => {
      const n = ((val + 10) / 30) * 100;
      return Math.min(100, Math.max(0, Math.round(n)));
    };

    return {
      dominancia: normalize(totals.D),
      influencia: normalize(totals.I),
      estabilidade: normalize(totals.S),
      conformidade: normalize(totals.C),
      raw_scores: totals
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const results = calculateResults();
      await addDoc(collection(db, 'perfis_disc'), {
        ...results,
        cliente_id: clienteId,
        created_by: user?.uid,
        created_at: new Date().toISOString()
      });
      toast.success('Perfil DISC salvo com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar perfil DISC.');
    } finally {
      setIsSaving(false);
    }
  };

  const isCurrentStepValid = answers[currentStep]?.most && answers[currentStep]?.least;
  const isLastStep = currentStep === DISC_QUESTIONS.length - 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline">Questão {currentStep + 1} de {DISC_QUESTIONS.length}</Badge>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all duration-300" 
              style={{ width: `${((currentStep + 1) / DISC_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
        <CardTitle>Perfil Comportamental DISC</CardTitle>
        <CardDescription>
          Para cada grupo de comportamentos abaixo, escolha um que <strong>MAIS</strong> se parece com você e um que <strong>MENOS</strong> se parece com você.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {DISC_QUESTIONS[currentStep].options.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50">
                <span className="text-sm font-medium text-slate-700">{option.label}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelect(option.id, 'most')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      answers[currentStep]?.most === option.id 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    Mais (+)
                  </button>
                  <button
                    onClick={() => handleSelect(option.id, 'least')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      answers[currentStep]?.least === option.id 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-red-300'
                    }`}
                  >
                    Menos (-)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            Anterior
          </Button>
          {isLastStep ? (
            <Button 
              className="flex-[2] bg-teal-600 hover:bg-teal-700"
              disabled={!isCurrentStepValid || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Finalizar e Salvar
            </Button>
          ) : (
            <Button 
              className="flex-[2] bg-teal-600 hover:bg-teal-700"
              disabled={!isCurrentStepValid}
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              Próxima Questão
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ValoresForm({ clienteId, onSuccess }: { clienteId: string, onSuccess: () => void }) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const VALORES_PREDEFINIDOS = [
    "Alegria", "Amizade", "Amor", "Autonomia", "Aventura", 
    "Beleza", "Compaixão", "Competência", "Conhecimento", "Coragem", 
    "Criatividade", "Crescimento", "Determinação", "Equidade", "Espiritualidade",
    "Estabilidade", "Excelência", "Família", "Fama", "Fé", 
    "Generosidade", "Harmonia", "Honestidade", "Humildade", "Independência", 
    "Inovação", "Integridade", "Justiça", "Lealdade", "Liberdade", 
    "Liderança", "Paz", "Poder", "Reconhecimento", "Respeito", 
    "Responsabilidade", "Riqueza", "Sabedoria", "Saúde", "Segurança", 
    "Sucesso", "Tradição", "Trabalho em Equipe", "Verdade"
  ].sort((a, b) => a.localeCompare(b));

  const toggleValue = (valor: string) => {
    if (selectedValues.includes(valor)) {
      setSelectedValues(prev => prev.filter(v => v !== valor));
    } else {
      if (selectedValues.length < 10) {
        setSelectedValues(prev => [...prev, valor]);
      } else {
        toast.error("Você já selecionou o limite máximo de 10 valores.");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'valores_pessoais'), {
        valores: selectedValues,
        cliente_id: clienteId,
        created_by: user?.uid,
        created_at: new Date().toISOString()
      });
      toast.success('Valores Pessoais salvos com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar Valores Pessoais.');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = selectedValues.length >= 5 && selectedValues.length <= 10;
  const missingCount = 5 - selectedValues.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Valores Pessoais</CardTitle>
            <CardDescription className="mt-1">
              Os valores guiam suas decisões e comportamentos. Identificar seus valores centrais ajuda a alinhar seus objetivos com o que realmente importa para você.
            </CardDescription>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 border border-slate-200 min-w-[120px]">
            <span className="text-2xl font-bold text-slate-700">{selectedValues.length}</span>
            <span className="text-xs text-slate-500 uppercase font-medium">Selecionados</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Progress or Status Notification */}
        <div className={`p-4 rounded-lg flex items-center gap-3 ${isFormValid ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-blue-50 text-blue-800 border border-blue-100'}`}>
          {isFormValid ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm">Ótimo! Você selecionou uma quantidade ideal de valores. Se quiser, pode selecionar mais {10 - selectedValues.length} ou finalizar.</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Selecione pelo menos <strong>{missingCount}</strong> valores para continuar (Máximo de 10).</span>
            </>
          )}
        </div>

        {/* Values Cloud */}
        <div className="flex flex-wrap gap-2">
          {VALORES_PREDEFINIDOS.map((valor) => {
            const isSelected = selectedValues.includes(valor);
            return (
              <button
                key={valor}
                onClick={() => toggleValue(valor)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md transform scale-105' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }
                `}
              >
                {valor}
              </button>
            );
          })}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!isFormValid || isSaving} 
          className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Salvar Valores Pessoais
        </Button>
      </CardContent>
    </Card>
  );
}
