import React, { useState } from 'react';
import { Sparkles, Brain, Lightbulb, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AiService, AiInsight } from '@/services/AiService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface AiInsightsProps {
  context: any;
  buttonText?: string;
  className?: string;
}

export function AiInsights({ context, buttonText = "Gerar Insights com IA", className }: AiInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AiInsight[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AiService.getInsights(context);
      setInsights(response.insights);
      setSummary(response.summary);
      toast.success('Insights gerados com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar insights');
      toast.error('Falha ao gerar insights da IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`overflow-hidden border-blue-100 shadow-lg bg-gradient-to-br from-white to-blue-50/30 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">PowerLife AI</CardTitle>
              <CardDescription>Análise inteligente baseada no contexto do cliente</CardDescription>
            </div>
          </div>
          <Button 
            onClick={generateInsights} 
            disabled={loading} 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {buttonText}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 my-4"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          ) : insights ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 py-4"
            >
              {summary && (
                <p className="text-slate-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100 italic text-sm leading-relaxed">
                  "{summary}"
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {insight.category}
                      </span>
                      <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      {insight.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {insight.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <Sparkles className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Clique para gerar insights estratégicos personalizados</p>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
