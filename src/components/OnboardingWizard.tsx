import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  LayoutDashboard, 
  Target, 
  PlusCircle, 
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

export function OnboardingWizard() {
  const { user, userData, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && user && userData && userData.onboarding_completed === false) {
      setIsOpen(true);
      checkCalendarStatus();
      
      const handleOAuthMessage = (event: MessageEvent) => {
        if (event.data.type === 'OAUTH_AUTH_SUCCESS' && event.data.provider === 'google') {
          setCalendarConnected(true);
          toast.success('Agenda conectada com sucesso!');
        }
      };
      
      window.addEventListener('message', handleOAuthMessage);
      return () => window.removeEventListener('message', handleOAuthMessage);
    }
  }, [loading, user, userData]);

  const checkCalendarStatus = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/calendar/status?userId=${user.uid}`);
      const data = await response.json();
      setCalendarConnected(data.connected);
    } catch (error) {
      console.error('Error checking calendar status:', error);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      if (data.url) {
        window.open(data.url, 'GoogleAuth', 'width=600,height=700');
      }
    } catch (error) {
      toast.error('Erro ao iniciar conexão com Google.');
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        onboarding_completed: true
      });
      setIsOpen(false);
      toast.success('Onboarding concluído! Aproveite a plataforma.');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Erro ao salvar progresso.');
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleComplete()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none [&>button]:hidden">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
          {/* Header/Progress */}
          <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <Badge className="bg-white/20 text-white border-none mb-4 px-3 py-1">
                Passo {step} de 4
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                {step === 1 && "Bem-vindo ao PowerLife! 🚀"}
                {step === 2 && "Sincronize sua Agenda 🗓️"}
                {step === 3 && "Seus Planos de Mentoria 💎"}
                {step === 4 && "Tudo Pronto! ✨"}
              </h2>
            </div>
            
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-20 -mb-20 blur-2xl" />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 relative bg-slate-50/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-slate-600 text-lg leading-relaxed">
                      Olá, <strong>{userData?.name}</strong>! Estamos entusiasmados em ajudar você a escalar impactar mais vidas com sua mentoria.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 h-fit">
                          <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Dashboard Unificado</h4>
                          <p className="text-xs text-slate-500">Visão 360º de todos os seus mentorados.</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600 h-fit">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Metodologia SMART</h4>
                          <p className="text-xs text-slate-500">Gestão profissional de metas e PDIs.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <p className="text-slate-600">
                      Integre sua agenda do Google para sincronizar sessões automaticamente e evitar conflitos de horário.
                    </p>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">Google Calendar</h4>
                          <p className="text-sm text-slate-500">Sincronização bidirecional</p>
                        </div>
                      </div>
                      <div>
                        {calendarConnected ? (
                          <Badge className="bg-green-100 text-green-700 px-3 py-1 border-none text-sm">Conectado ✅</Badge>
                        ) : (
                          <Button onClick={handleConnectCalendar} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
                             Conectar <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic">
                      * Você também pode configurar isso mais tarde em Perfil {">"} Configurações.
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <p className="text-slate-600">
                      Defina como você deseja cobrar pelas suas mentorias. Crie planos personalizados para diferentes níveis de acompanhamento.
                    </p>
                    <div className="space-y-4">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <PlusCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">Crie seu primeiro Plano</h4>
                            <p className="text-sm text-slate-500">Defina recorrência, preço e benefícios inclusos.</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs flex gap-3">
                         <Sparkles className="w-4 h-4 shrink-0" />
                         <p>Dica: Mentores que oferecem pelo menos 3 opções de planos (Básico, Pro, Master) aumentam sua conversão em até 40%.</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">Parabéns!</h3>
                      <p className="text-slate-600 max-w-sm">
                        Sua conta foi configurada com sucesso. Você já pode convidar seus primeiros mentorados e começar as sessões.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <DialogFooter className="p-8 bg-white border-t border-slate-100 flex-row justify-between sm:justify-between items-center">
            <Button
              variant="ghost"
              onClick={step === 1 ? handleComplete : prevStep}
              className="text-slate-500"
            >
              {step === 1 ? "Pular Onboarding" : "Voltar"}
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} 
                  />
                ))}
              </div>
              
              {step < 4 ? (
                <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 px-6 gap-2">
                  Próximo <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700 px-8">
                  Começar Agora
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
