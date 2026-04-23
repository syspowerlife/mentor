import React from 'react';
import { PricingTable } from '@/components/PricingTable';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, CreditCard, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-bold text-xl text-slate-800">Planos e Assinaturas</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Ambiente Seguro
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-500" />
              Pix e Cartão
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-4 py-1">
            Investimento no seu Negócio
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Escolha o plano ideal para sua <span className="text-blue-600">mentoria</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Escalone seu atendimento, profissionalize sua marca e ofereça uma experiência 
            exclusiva para seus mentorados com o PowerLife.
          </p>
        </div>

        <PricingTable />

        <div className="mt-20 max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Perguntas Frequentes</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Posso cancelar quando quiser?
              </h4>
              <p className="text-sm text-slate-600">
                Sim, as assinaturas são mensais e você pode cancelar a qualquer momento sem taxas de fidelidade.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Quais as formas de pagamento?
              </h4>
              <p className="text-sm text-slate-600">
                Aceitamos Pix (com liberação instantânea) e todos os cartões de crédito via Mercado Pago.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center text-slate-400 text-sm">
        <p>© 2026 PowerLife Mentoring. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
