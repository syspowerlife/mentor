import React from 'react';
import { useFeatures, FeatureFlags } from '@/hooks/useFeatures';
import { AlertCircle, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

interface FeatureFallbackProps {
  feature?: keyof FeatureFlags | (keyof FeatureFlags)[];
  mode?: 'all' | 'any';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfMissing?: boolean;
  label?: string;
}

export function FeatureFallback({ 
  feature, 
  mode = 'all',
  children, 
  fallback, 
  hideIfMissing = false,
  label
}: FeatureFallbackProps) {
  const { features, loading } = useFeatures();
  const { isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const featureList = Array.isArray(feature) ? feature : (feature ? [feature] : []);
  const isEnabled = mode === 'all' 
    ? featureList.every(f => features[f])
    : featureList.some(f => features[f]);

  if (isEnabled || featureList.length === 0) {
    return <>{children}</>;
  }

  if (hideIfMissing) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const featureLabels: Record<keyof FeatureFlags, string> = {
    gemini: 'Inteligência Artificial (Gemini)',
    resend: 'Serviço de E-mail (Resend)',
    stripe: 'Pagamentos Stripe',
    mercadopago: 'Pagamentos Mercado Pago',
    googleCalendar: 'Integração Google Calendar',
  };

  const displayLabel = label || (featureList.length === 1 
    ? featureLabels[featureList[0]]
    : 'Recursos Necessários');

  return (
    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
      <CardContent className="p-8 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800">Recurso não disponível</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            O recurso <span className="font-semibold text-slate-700">{displayLabel}</span> requer configurações que não foram encontradas no ambiente.
          </p>
        </div>
        
        {isAdmin && (
          <div className="mt-2 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 flex items-start gap-2 text-left">
              <Settings className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Dica para Administrador:</p>
                <p>Configure a respectiva chave de API nas <strong>Configurações do Projeto</strong> no painel lateral do AI Studio para habilitar este recurso.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
