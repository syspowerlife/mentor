import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
  { id: 'roda', nameKey: 'portal.evaluations.roda.name', icon: TrendingUp, descriptionKey: 'portal.evaluations.roda.description', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'swot', nameKey: 'portal.evaluations.swot.title', icon: Target, descriptionKey: 'portal.evaluations.swot.description', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'disc', nameKey: 'portal.evaluations.disc.title', icon: Users, descriptionKey: 'portal.evaluations.disc.description', color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 'valores', nameKey: 'portal.evaluations.valores.title', icon: Star, descriptionKey: 'portal.evaluations.valores.description', color: 'text-purple-600', bg: 'bg-purple-50' },
];

export function PortalEvaluations() {
  const { t } = useTranslation();
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
            <CardTitle>{t('portal.dashboard.unlinked.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/portal/dashboard')} variant="outline" className="w-full">
              {t('portal.evaluations.back')}
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
            {selectedTool ? t(TOOLS.find(t => t.id === selectedTool)?.nameKey || '') : t('portal.evaluations.title')}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!selectedTool ? (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">{t('portal.evaluations.choose_tool')}</h1>
              <p className="text-slate-500">{t('portal.evaluations.choose_tool_desc')}</p>
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
                      <h4 className="font-bold text-slate-900">{t(tool.nameKey)}</h4>
                      <p className="text-xs text-slate-500">{t(tool.descriptionKey)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedTool === 'roda' && <RodaDaVidaForm clienteId={cliente.id} cliente={cliente} onSuccess={() => setSelectedTool(null)} />}
            {selectedTool === 'swot' && <SwotForm clienteId={cliente.id} cliente={cliente} onSuccess={() => setSelectedTool(null)} />}
            {selectedTool === 'disc' && <DiscForm clienteId={cliente.id} cliente={cliente} onSuccess={() => setSelectedTool(null)} />}
            {selectedTool === 'valores' && <ValoresForm clienteId={cliente.id} cliente={cliente} onSuccess={() => setSelectedTool(null)} />}
          </div>
        )}
      </main>
    </div>
  );
}

// Simplified Form Components for the Portal

function RodaDaVidaForm({ clienteId, cliente, onSuccess }: { clienteId: string, cliente: any, onSuccess: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [titulo, setTitulo] = useState(t('portal.evaluations.roda.name'));
  const [isSaving, setIsSaving] = useState(false);
  const [valores, setValores] = useState<Record<string, number>>({
    saude_fisica: 5, desenvolvimento_mental: 5, inteligencia_emocional: 5,
    familia: 5, romance: 5, vida_social: 5, carreira: 5, financas: 5,
    contribuicao_social: 5, divertimento_lazer: 5, saude_ambiente: 5
  });

  const AREAS = [
    { id: 'saude_fisica', label: t('portal.evaluations.roda.areas.saude_fisica') },
    { id: 'desenvolvimento_mental', label: t('portal.evaluations.roda.areas.desenvolvimento_mental') },
    { id: 'inteligencia_emocional', label: t('portal.evaluations.roda.areas.inteligencia_emocional') },
    { id: 'familia', label: t('portal.evaluations.roda.areas.familia') },
    { id: 'romance', label: t('portal.evaluations.roda.areas.romance') },
    { id: 'vida_social', label: t('portal.evaluations.roda.areas.vida_social') },
    { id: 'carreira', label: t('portal.evaluations.roda.areas.carreira') },
    { id: 'financas', label: t('portal.evaluations.roda.areas.financas') },
    { id: 'contribuicao_social', label: t('portal.evaluations.roda.areas.contribuicao_social') },
    { id: 'divertimento_lazer', label: t('portal.evaluations.roda.areas.divertimento_lazer') },
    { id: 'saude_ambiente', label: t('portal.evaluations.roda.areas.saude_ambiente') },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'rodas_da_vida'), {
        titulo,
        ...valores,
        created_by: user?.uid,
        cliente_id: clienteId,
        cliente_uid: user?.uid,
        profissional_id: cliente?.profissional_id || null,
        created_date: serverTimestamp(),
        tipo_avaliacao: 'atual'
      });
      toast.success(t('portal.evaluations.roda.save_success'));
      onSuccess();
    } catch (error) {
      toast.error(t('portal.evaluations.roda.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('portal.evaluations.roda.form_title')}</CardTitle>
        <CardDescription>{t('portal.evaluations.roda.form_desc')}</CardDescription>
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
          {t('portal.evaluations.save_button')}
        </Button>
      </CardContent>
    </Card>
  );
}

function SwotForm({ clienteId, cliente, onSuccess }: { clienteId: string, cliente: any, onSuccess: () => void }) {
  const { t } = useTranslation();
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
        cliente_uid: user?.uid,
        profissional_id: cliente?.profissional_id || null,
        created_by: user?.uid,
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'analises_swot'), payload);
      toast.success(t('portal.evaluations.swot.save_success'));
      onSuccess();
    } catch (error) {
      toast.error(t('portal.evaluations.swot.save_error'));
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
        <CardTitle className="text-xl">{t('portal.evaluations.swot.title')}</CardTitle>
        <CardDescription>
          {t('portal.evaluations.swot.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Forças (Strengths) */}
          <div className="space-y-2 border-t-4 border-emerald-500 bg-emerald-50/50 p-4 rounded-b-xl shadow-sm">
            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('portal.evaluations.swot.strengths_title')}
            </h3>
            <p className="text-xs text-emerald-700/80 mb-2">{t('portal.evaluations.swot.strengths_desc')}</p>
            <textarea 
              rows={4}
              placeholder={t('portal.evaluations.swot.strengths_placeholder')}
              className="w-full text-sm p-3 border-emerald-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              value={swotData.forcas}
              onChange={(e) => setSwotData({...swotData, forcas: e.target.value})}
            />
          </div>

          {/* Fraquezas (Weaknesses) */}
          <div className="space-y-2 border-t-4 border-red-500 bg-red-50/50 p-4 rounded-b-xl shadow-sm">
            <h3 className="font-bold text-red-800 flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t('portal.evaluations.swot.weaknesses_title')}
            </h3>
            <p className="text-xs text-red-700/80 mb-2">{t('portal.evaluations.swot.weaknesses_desc')}</p>
            <textarea 
              rows={4}
              placeholder={t('portal.evaluations.swot.weaknesses_placeholder')}
              className="w-full text-sm p-3 border-red-200 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white"
              value={swotData.fraquezas}
              onChange={(e) => setSwotData({...swotData, fraquezas: e.target.value})}
            />
          </div>

          {/* Oportunidades (Opportunities) */}
          <div className="space-y-2 border-t-4 border-blue-500 bg-blue-50/50 p-4 rounded-b-xl shadow-sm">
            <h3 className="font-bold text-blue-800 flex items-center gap-2">
              <Star className="w-5 h-5" />
              {t('portal.evaluations.swot.opportunities_title')}
            </h3>
            <p className="text-xs text-blue-700/80 mb-2">{t('portal.evaluations.swot.opportunities_desc')}</p>
            <textarea 
              rows={4}
              placeholder={t('portal.evaluations.swot.opportunities_placeholder')}
              className="w-full text-sm p-3 border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={swotData.oportunidades}
              onChange={(e) => setSwotData({...swotData, oportunidades: e.target.value})}
            />
          </div>

          {/* Ameaças (Threats) */}
          <div className="space-y-2 border-t-4 border-slate-700 bg-slate-50 p-4 rounded-b-xl shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('portal.evaluations.swot.threats_title')}
            </h3>
            <p className="text-xs text-slate-600/80 mb-2">{t('portal.evaluations.swot.threats_desc')}</p>
            <textarea 
              rows={4}
              placeholder={t('portal.evaluations.swot.threats_placeholder')}
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
          {t('portal.evaluations.save_button')}
        </Button>
      </CardContent>
    </Card>
  );
}

function DiscForm({ clienteId, cliente, onSuccess }: { clienteId: string, cliente: any, onSuccess: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { most: string, least: string }>>({});

  const DISC_QUESTIONS = [
    {
      id: 1,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.1.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.1.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.1.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.1.c') }
      ]
    },
    {
      id: 2,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.2.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.2.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.2.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.2.c') }
      ]
    },
    {
      id: 3,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.3.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.3.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.3.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.3.c') }
      ]
    },
    {
      id: 4,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.4.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.4.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.4.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.4.c') }
      ]
    },
    {
      id: 5,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.5.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.5.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.5.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.5.c') }
      ]
    },
    {
      id: 6,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.6.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.6.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.6.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.6.c') }
      ]
    },
    {
      id: 7,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.7.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.7.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.7.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.7.c') }
      ]
    },
    {
      id: 8,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.8.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.8.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.8.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.8.c') }
      ]
    },
    {
      id: 9,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.9.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.9.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.9.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.9.c') }
      ]
    },
    {
      id: 10,
      options: [
        { id: 'D', label: t('portal.evaluations.disc.questions.10.d') },
        { id: 'I', label: t('portal.evaluations.disc.questions.10.i') },
        { id: 'S', label: t('portal.evaluations.disc.questions.10.s') },
        { id: 'C', label: t('portal.evaluations.disc.questions.10.c') }
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
      // Determine dominant profile
      const scores = {
        D: results.dominancia,
        I: results.influencia,
        S: results.estabilidade,
        C: results.conformidade
      };
      const perfil_dominante = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];

      await addDoc(collection(db, 'perfis_disc'), {
        ...results,
        titulo: 'Perfil DISC',
        perfil_dominante,
        cliente_id: clienteId,
        cliente_uid: user?.uid,
        profissional_id: cliente?.profissional_id || null,
        created_by: user?.uid,
        created_at: serverTimestamp()
      });
      toast.success(t('portal.evaluations.disc.save_success'));
      onSuccess();
    } catch (error) {
      toast.error(t('portal.evaluations.disc.save_error'));
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
          <Badge variant="outline">{t('portal.evaluations.disc.question_count', { current: currentStep + 1, total: DISC_QUESTIONS.length })}</Badge>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all duration-300" 
              style={{ width: `${((currentStep + 1) / DISC_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
        <CardTitle>{t('portal.evaluations.disc.title')}</CardTitle>
        <CardDescription>
          {t('portal.evaluations.disc.description')}
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
                    {t('portal.evaluations.disc.most')}
                  </button>
                  <button
                    onClick={() => handleSelect(option.id, 'least')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      answers[currentStep]?.least === option.id 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-red-300'
                    }`}
                  >
                    {t('portal.evaluations.disc.least')}
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
            {t('portal.evaluations.disc.back')}
          </Button>
          {isLastStep ? (
            <Button 
              className="flex-[2] bg-teal-600 hover:bg-teal-700"
              disabled={!isCurrentStepValid || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {t('portal.evaluations.disc.finish')}
            </Button>
          ) : (
            <Button 
              className="flex-[2] bg-teal-600 hover:bg-teal-700"
              disabled={!isCurrentStepValid}
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              {t('portal.evaluations.disc.next')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ValoresForm({ clienteId, cliente, onSuccess }: { clienteId: string, cliente: any, onSuccess: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const VALORES_PREDEFINIDOS = [
    { id: 'joy', key: 'values.list.joy' },
    { id: 'friendship', key: 'values.list.friendship' },
    { id: 'love', key: 'values.list.love' },
    { id: 'autonomy', key: 'values.list.autonomy' },
    { id: 'adventure', key: 'values.list.adventure' },
    { id: 'beauty', key: 'values.list.beauty' },
    { id: 'compassion', key: 'values.list.compassion' },
    { id: 'competence', key: 'values.list.competence' },
    { id: 'knowledge', key: 'values.list.knowledge' },
    { id: 'courage', key: 'values.list.courage' },
    { id: 'creativity', key: 'values.list.creativity' },
    { id: 'growth', key: 'values.list.growth' },
    { id: 'determination', key: 'values.list.determination' },
    { id: 'equity', key: 'values.list.equity' },
    { id: 'spirituality', key: 'values.list.spirituality' },
    { id: 'stability', key: 'values.list.stability' },
    { id: 'excellence', key: 'values.list.excellence' },
    { id: 'family', key: 'values.list.family' },
    { id: 'fame', key: 'values.list.fame' },
    { id: 'faith', key: 'values.list.faith' },
    { id: 'generosity', key: 'values.list.generosity' },
    { id: 'harmony', key: 'values.list.harmony' },
    { id: 'honesty', key: 'values.list.honesty' },
    { id: 'humility', key: 'values.list.humility' },
    { id: 'independence', key: 'values.list.independence' },
    { id: 'innovation', key: 'values.list.innovation' },
    { id: 'integrity', key: 'values.list.integrity' },
    { id: 'justice', key: 'values.list.justice' },
    { id: 'loyalty', key: 'values.list.loyalty' },
    { id: 'freedom', key: 'values.list.freedom' },
    { id: 'leadership', key: 'values.list.leadership' },
    { id: 'peace', key: 'values.list.peace' },
    { id: 'power', key: 'values.list.power' },
    { id: 'recognition', key: 'values.list.recognition' },
    { id: 'respect', key: 'values.list.respect' },
    { id: 'responsibility', key: 'values.list.responsibility' },
    { id: 'wealth', key: 'values.list.wealth' },
    { id: 'wisdom', key: 'values.list.wisdom' },
    { id: 'health', key: 'values.list.health' },
    { id: 'security', key: 'values.list.security' },
    { id: 'success', key: 'values.list.success' },
    { id: 'tradition', key: 'values.list.tradition' },
    { id: 'teamwork', key: 'values.list.teamwork' },
    { id: 'truth', key: 'values.list.truth' }
  ].sort((a, b) => t(a.key).localeCompare(t(b.key)));

  const toggleValue = (valorId: string) => {
    if (selectedValues.includes(valorId)) {
      setSelectedValues(prev => prev.filter(v => v !== valorId));
    } else {
      if (selectedValues.length < 10) {
        setSelectedValues(prev => [...prev, valorId]);
      } else {
        toast.error(t('values.errors.max_reached'));
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'valores_pessoais'), {
        titulo: t('values.title'),
        valores_selecionados: selectedValues, // Store the IDs
        cliente_id: clienteId,
        cliente_uid: user?.uid,
        profissional_id: cliente?.profissional_id || null,
        created_by: user?.uid,
        created_at: serverTimestamp()
      });
      toast.success(t('portal.evaluations.valores.save_success'));
      onSuccess();
    } catch (error) {
      toast.error(t('portal.evaluations.valores.save_error'));
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
            <CardTitle className="text-xl">{t('portal.evaluations.valores.title')}</CardTitle>
            <CardDescription className="mt-1">
              {t('portal.evaluations.valores.description')}
            </CardDescription>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 border border-slate-200 min-w-[120px]">
            <span className="text-2xl font-bold text-slate-700">{selectedValues.length}</span>
            <span className="text-xs text-slate-500 uppercase font-medium">{t('portal.evaluations.valores.selected')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Progress or Status Notification */}
        <div className={`p-4 rounded-lg flex items-center gap-3 ${isFormValid ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-blue-50 text-blue-800 border border-blue-100'}`}>
          {isFormValid ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm">{t('portal.evaluations.valores.status_ideal', { count: 10 - selectedValues.length })}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <span className="text-sm">{t('portal.evaluations.valores.status_missing', { count: missingCount })}</span>
            </>
          )}
        </div>

        {/* Values Cloud */}
        <div className="flex flex-wrap gap-2">
          {VALORES_PREDEFINIDOS.map((valor) => {
            const isSelected = selectedValues.includes(valor.id);
            return (
              <button
                key={valor.id}
                onClick={() => toggleValue(valor.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md transform scale-105' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }
                `}
              >
                {t(valor.key)}
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
          {t('portal.evaluations.save_button')}
        </Button>
      </CardContent>
    </Card>
  );
}
