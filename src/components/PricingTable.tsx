import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { handleApiResponse } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { FeatureFallback } from './FeatureFallback';

interface Plan {
  id: string;
  name: string;
  price: string | number;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
}

const defaultPlans: Plan[] = [
  {
    id: 'pro',
    name: 'Profissional',
    price: 'R$ 97,00',
    description: 'Ideal para mentores que estão começando a escalar.',
    color: 'blue',
    features: [
      'Até 20 clientes ativos',
      'Ferramentas de avaliação ilimitadas',
      'Dashboard de evolução do cliente',
      'Suporte via e-mail',
      'Exportação de relatórios em PDF'
    ]
  },
  {
    id: 'master',
    name: 'Master',
    price: 'R$ 197,00',
    description: 'Para mentores de alta performance e grandes grupos.',
    popular: true,
    color: 'indigo',
    features: [
      'Clientes ilimitados',
      'Personalização de marca (White-label)',
      'Gestão de múltiplos profissionais',
      'Suporte prioritário via WhatsApp',
      'Análises avançadas de engajamento',
      'Integração com agenda externa'
    ]
  }
];

export function PricingTable() {
  const { user, userData } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicPlans = async () => {
      try {
        const q = query(collection(db, 'planos'), where('active', '==', true), orderBy('price', 'asc'));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const dynamicPlans = snapshot.docs.map(doc => {
            const data = doc.data();
            const colors = ['blue', 'indigo', 'purple', 'emerald', 'cyan'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            return {
              id: doc.id,
              name: data.name,
              price: `R$ ${Number(data.price).toFixed(2).replace('.', ',')}`,
              description: data.description,
              features: data.features || [],
              popular: data.popular || false,
              color: randomColor
            };
          });
          
          if (dynamicPlans.length > 0) {
            setPlans(dynamicPlans);
          }
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDynamicPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para assinar um plano.');
      return;
    }

    setLoadingPlan(planId);
    try {
      // Determinar se é um plano recorrente (assinatura) ou pagamento único
      // Todo plano pago no PowerLife agora é tratado como Assinatura para permitir recorrência
      const endpoint = '/api/payments/create-subscription';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId,
          userId: user.uid,
          email: user.email,
          name: userData?.name || user.displayName || 'Usuário PowerLife'
        })
      });

      const data = await handleApiResponse(response, 'Erro ao gerar checkout');
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de checkout não encontrada. Entre em contato com o suporte.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Não foi possível iniciar o pagamento. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <FeatureFallback feature={['stripe', 'mercadopago']} mode="any" label="Gateways de Pagamento">
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto py-12 px-4 relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative flex flex-col border-2 transition-all duration-300 hover:shadow-xl ${
            plan.popular ? 'border-indigo-500 scale-105 z-10' : 'border-slate-200'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Mais Popular
              </Badge>
            </div>
          )}
          
          <CardHeader className="text-center pb-2">
            <div className={`w-12 h-12 rounded-2xl bg-${plan.color}-100 flex items-center justify-center mx-auto mb-4`}>
              {plan.id === 'pro' ? <Zap className="w-6 h-6 text-blue-600" /> : <Star className="w-6 h-6 text-indigo-600" />}
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
            <CardDescription className="text-slate-500 mt-2">{plan.description}</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 pt-6">
            <div className="text-center mb-8">
              <span className="text-4xl font-black text-slate-900">{plan.price}</span>
              <span className="text-slate-500 ml-1">/mês</span>
            </div>

            <ul className="space-y-4">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                  <div className={`mt-0.5 p-0.5 rounded-full bg-${plan.color}-100`}>
                    <Check className={`w-3.5 h-3.5 text-${plan.color}-600`} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="pt-8 pb-8">
            <Button 
              className={`w-full h-12 text-base font-bold transition-all ${
                plan.popular 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
              onClick={() => handleSubscribe(plan.id)}
              disabled={loadingPlan !== null || userData?.plan === plan.id}
            >
              {loadingPlan === plan.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : userData?.plan === plan.id ? (
                'Plano Atual'
              ) : (
                'Assinar Agora'
              )}
            </Button>
          </CardFooter>
          
          <div className="px-8 pb-6 text-center">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Pagamento seguro via Mercado Pago
            </p>
          </div>
        </Card>
      ))}
    </div>
    </FeatureFallback>
  );
}
