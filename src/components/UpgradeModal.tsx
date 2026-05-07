import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: string;
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  title = "Aumente seu Potencial", 
  description = "Este recurso está disponível apenas nos planos pagos do PowerLife.",
  feature
}: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative">
          <div className="absolute top-4 right-4 opacity-10">
            <Zap className="w-24 h-24" />
          </div>
          
          <DialogHeader className="text-left space-y-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-2 backdrop-blur-md">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black text-white">{title}</DialogTitle>
            <DialogDescription className="text-blue-100 text-lg leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 bg-white">
          {feature && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex items-start gap-3">
              <div className="p-1 rounded-full bg-blue-100 text-blue-600 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <p className="text-sm text-blue-800 font-medium">
                Desbloqueie <span className="font-bold">{feature}</span> e muito mais ao assinar o plano PRO.
              </p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">O que você ganha no PRO:</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                'Até 20 clientes ativos',
                'Insights automáticos com IA',
                'Integração com Google Calendar',
                'Relatórios avançados de progresso'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-600">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-200 group"
              onClick={() => {
                onClose();
                navigate('/pricing');
              }}
            >
              Ver Planos de Assinatura
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="ghost" className="w-full text-slate-400 font-medium h-10" onClick={onClose}>
              Talvez mais tarde
            </Button>
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Assinaturas mensais sem fidelidade. Cancele quando quiser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
