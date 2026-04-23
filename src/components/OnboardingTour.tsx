import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export function OnboardingTour() {
  const { t } = useTranslation();
  const { user, userData, loading } = useAuth();
  const [run, setRun] = useState(false);
  const JoyrideComponent = Joyride as any;

  useEffect(() => {
    if (!loading && user && userData && userData.onboarding_completed === false) {
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, user, userData]);

  const steps: any[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Bem-vindo ao PowerLife! 🚀',
      content: 'Estamos felizes em ter você aqui. Vamos fazer um tour rápido pelas principais funcionalidades para você começar com tudo.',
      disableBeacon: true,
    },
    {
      target: '#dashboard-title',
      title: 'Seu Painel de Controle',
      content: 'Aqui você tem uma visão geral de todo o seu progresso e dos seus clientes.',
    },
    {
      target: '#dashboard-metrics',
      title: 'Métricas em Tempo Real',
      content: 'Acompanhe taxas de conclusão, metas ativas e próximos agendamentos de forma visual.',
    },
    {
      target: '#sidebar-tools',
      title: 'Ferramentas Profissionais',
      content: 'Acesse metodologias consagradas como a Roda da Vida (para equilíbrio pessoal) e Metas SMART (específicas, mensuráveis, atingíveis, relevantes e temporais).',
    },
    {
      target: '#header-notifications',
      title: 'Fique por Dentro',
      content: 'Receba alertas sobre prazos de metas, novos feedbacks e agendamentos importantes.',
    },
    {
      target: '#header-user',
      title: 'Seu Perfil',
      content: 'Gerencie suas informações profissionais e configurações da conta aqui.',
    },
    {
      target: 'body',
      placement: 'center',
      title: 'Tudo Pronto! ✨',
      content: 'Agora você está pronto para transformar vidas. Explore as ferramentas e comece sua jornada!',
    },
  ];

  const handleJoyrideCallback = async (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status) && user) {
      setRun(false);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          onboarding_completed: true
        });
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
  };

  if (!run) return null;

  return (
    <JoyrideComponent
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          primaryColor: '#2563eb',
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
        },
        buttonBack: {
          fontSize: '14px',
          fontWeight: '600',
          marginRight: '10px',
        },
        buttonSkip: {
          fontSize: '14px',
          color: '#64748b',
        }
      } as any}
      locale={{
        back: 'Anterior',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tour',
      }}
    />
  );
}
