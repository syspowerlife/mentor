import React, { useState } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { PlanConfig } from '@/constants/plans';
import { UpgradeModal } from './UpgradeModal';
import { Lock } from 'lucide-react';
import { Button } from './ui/button';

interface PlanGateProps {
  feature?: keyof PlanConfig['limits'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeModal?: boolean;
  lockMessage?: string;
}

export function PlanGate({ 
  feature, 
  children, 
  fallback,
  showUpgradeModal = true,
  lockMessage = "Este recurso está bloqueado no seu plano atual."
}: PlanGateProps) {
  const { hasFeature, plan } = usePlan();
  const [modalOpen, setModalOpen] = useState(false);

  // If no feature specified, just pass through
  if (!feature) return <>{children}</>;

  const isEnabled = hasFeature(feature);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const featureLabels: Partial<Record<keyof PlanConfig['limits'], string>> = {
    aiInsights: 'Inteligência Artificial',
    googleCalendar: 'Google Calendar',
    customBranding: 'Personalização de Marca',
    prioritySupport: 'Suporte Prioritário',
  };

  return (
    <>
      <div className="relative group cursor-not-allowed">
        <div className="opacity-50 pointer-events-none grayscale-[0.5]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/40 backdrop-blur-[1px] rounded-xl">
          <Button 
            variant="secondary" 
            size="sm" 
            className="gap-2 shadow-lg scale-90 group-hover:scale-100 transition-transform"
            onClick={() => setModalOpen(true)}
          >
            <Lock className="w-4 h-4" />
            Upgrade para Liberar
          </Button>
        </div>
      </div>

      <UpgradeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title="Recurso Bloqueado"
        description={lockMessage}
        feature={featureLabels[feature]}
      />
    </>
  );
}
