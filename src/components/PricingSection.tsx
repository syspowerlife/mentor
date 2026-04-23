import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, CreditCard, QrCode } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { handleApiResponse } from '@/lib/utils';
import { toast } from 'sonner';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PricingSectionProps {
  showCurrentPlan?: boolean;
}

export function PricingSection({ showCurrentPlan = false }: PricingSectionProps) {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');

  const currentPlan = userData?.plan || 'free';

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, 'planos'), where('active', '==', true), orderBy('price', 'asc'));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const fetchedPlans = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            price: doc.data().price,
            interval: doc.data().interval || 'mês',
            description: doc.data().description,
            features: doc.data().features || [],
            popular: doc.data().popular || false
          }));

          setPlans(fetchedPlans);
        } else {
          setPlans([]);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Erro ao carregar planos de assinatura.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleUpgrade = async (plan: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (plan === currentPlan || plan === 'free') {
      toast.info('Você já está neste plano ou o selecionou de forma indevida.');
      return;
    }

    setLoadingPlan(plan);
    try {
      // Usando exclusivamente Mercado Pago conforme analytics/issues/05-payment-gateway-selector.md
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          userId: user.uid,
          email: user.email,
          name: userData?.name || user.displayName || 'Usuário',
          paymentMethod // Podemos usar no backend para filtrar tipos de pagamento se desejado
        }),
      });

      const data = await handleApiResponse(response, 'Serviço de pagamentos temporariamente indisponível.');

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento.');
      }
    } catch (error: any) {
      console.error('Checkout Error:', error);
      toast.error(error.message || 'Erro ao processar pagamento com Mercado Pago.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Escolha seu método de pagamento</h2>
          <p className="text-slate-500 text-sm">Garantido por Mercado Pago</p>
        </div>
        
        <Tabs value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <TabsTrigger value="card" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CreditCard className="w-4 h-4" />
              Cartão de Crédito
            </TabsTrigger>
            <TabsTrigger value="pix" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <QrCode className="w-4 h-4" />
              Pix / Boleto
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm min-h-[300px]">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
        
        {!loading && plans.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800">Novos planos em breve</h3>
            <p className="text-slate-500 mt-2">No momento não há planos ativos para assinatura.</p>
          </div>
        )}

        {plans.map((plan) => (
          <PricingCard 
            key={plan.id}
            title={plan.name}
            price={`R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`}
            period={plan.price > 0 ? `/${plan.interval}` : ''}
            description={plan.description}
            features={plan.features}
            buttonText={currentPlan === plan.id ? 'Plano Atual' : (plan.price === 0 ? 'Selecionar' : `Assinar ${plan.name}`)}
            disabled={currentPlan === plan.id || plan.price === 0}
            highlighted={plan.popular}
            loading={loadingPlan === plan.id}
            onClick={() => handleUpgrade(plan.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PricingCard({ title, price, period, description, features, buttonText, highlighted = false, onClick, disabled, loading }: any) {
  return (
    <div className={`p-8 rounded-3xl border flex flex-col ${highlighted ? 'bg-slate-900 text-white border-slate-800 shadow-xl relative' : 'bg-white text-slate-900 border-slate-200'}`}>
      {highlighted && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">MAIS COMPLETO</div>}
      <div className="mb-8">
        <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <p className={`text-sm ${highlighted ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
      </div>
      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className={highlighted ? 'text-slate-400' : 'text-slate-500'}>{period}</span>
      </div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${highlighted ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={highlighted ? 'text-slate-300' : 'text-slate-600'}>{feature}</span>
          </li>
        ))}
      </ul>
      <Button 
        onClick={onClick} 
        disabled={disabled || loading} 
        className={`w-full h-12 text-lg font-semibold ${highlighted ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : buttonText}
      </Button>
    </div>
  );
}
