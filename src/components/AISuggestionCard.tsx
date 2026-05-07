import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Target, ArrowRight, BrainCircuit, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { generateProfileInsights, AIInsightResponse, AISuggestedGoal } from '@/services/geminiService';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { MetaStatus } from '@/types/enums';

import { PlanGate } from './PlanGate';

interface AISuggestionCardProps {
  discData?: any;
  swotData?: any;
  rodaData?: any;
  clienteId?: string | null;
  autoGenerate?: boolean;
}

export function AISuggestionCard({ discData, swotData, rodaData, clienteId, autoGenerate = false }: AISuggestionCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [insight, setInsight] = useState<AIInsightResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addedGoals, setAddedGoals] = useState<string[]>([]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateProfileInsights({
        disc: discData,
        swot: swotData,
        roda: rodaData,
        language: i18n.language
      });
      setInsight(result);
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar insights");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async (goal: AISuggestedGoal, index: number) => {
    if (!user) return;
    
    const toastId = toast.loading("Salvando meta...");
    try {
      const path = 'metas_smart';
      await addDoc(collection(db, path), {
        ...goal,
        status: MetaStatus.A_FAZER,
        created_by: user.uid,
        profissional_id: user.uid,
        cliente_id: clienteId || null,
        created_at: Timestamp.now(),
        ai_generated: true
      });
      
      setAddedGoals(prev => [...prev, index.toString()]);
      toast.success("Meta adicionada com sucesso!", { id: toastId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'metas_smart');
      toast.error("Erro ao salvar meta", { id: toastId });
    }
  };

  if (!insight && !isLoading) {
    return (
      <PlanGate feature="aiInsights" lockMessage="Insights estratégicos com IA estão disponíveis a partir do plano Profissional.">
        <Card className="overflow-hidden border-2 border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Insights Estratégicos com IA</h3>
              <p className="text-slate-600 max-w-md">
                Nossa inteligência analisa seus assessments para sugerir ações e metas personalizadas para sua evolução.
              </p>
            </div>
            <Button 
              onClick={handleGenerate} 
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 group"
            >
              <BrainCircuit className="w-4 h-4 mr-2" />
              Gerar Insights Agora
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </PlanGate>
    );
  }

  return (
    <Card className="overflow-hidden border-t-4 border-t-purple-500 shadow-lg">
      <CardHeader className="bg-slate-50/80 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Análise da Mente Mentora</CardTitle>
              <CardDescription>Baseado nos seus últimos diagnósticos</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">AI GEMINI</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium animate-pulse">Correlacionando dados DISC e SWOT...</span>
              </div>
            </div>
          </div>
        ) : insight && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Analysis Section */}
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed italic border-l-4 border-purple-200 pl-4 bg-purple-50/30 py-2 rounded-r-lg">
                "{insight.analysis}"
              </p>
            </div>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insight.suggestions.map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-colors group">
                  <div className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Dica {i + 1}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 group-hover:line-clamp-none transition-all">
                    {s}
                  </p>
                </div>
              ))}
            </div>

            {/* Suggested SMART Goals */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Target className="w-5 h-5 text-blue-600" />
                Planos de Ação Recomendados
              </div>
              <div className="space-y-3">
                {insight.suggestedGoals.map((goal, i) => (
                  <div key={i} className="group relative overflow-hidden bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-all hover:border-blue-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase">Smart Meta</span>
                          <h4 className="font-bold text-slate-900">{goal.titulo}</h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{goal.especifica}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={addedGoals.includes(i.toString()) ? "ghost" : "outline"} 
                        className={addedGoals.includes(i.toString()) ? "text-green-600" : "border-blue-200 text-blue-600 hover:bg-blue-50"}
                        onClick={() => handleAddGoal(goal, i)}
                        disabled={addedGoals.includes(i.toString())}
                      >
                        {addedGoals.includes(i.toString()) ? (
                          <><CheckCircle2 className="w-4 h-4 mr-2" /> No Plano</>
                        ) : (
                          <><PlusIcon className="w-4 h-4 mr-2" /> Aceitar como Meta</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button variant="ghost" size="sm" onClick={handleGenerate} className="text-slate-400 hover:text-purple-600">
                <Loader2 className={`w-3 h-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Regerar insights
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function PlusIcon(props: any) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
