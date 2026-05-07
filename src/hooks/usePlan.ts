import { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PlanType } from '@/types/enums';
import { PLAN_CONFIGS, PlanConfig } from '@/constants/plans';

export function usePlan() {
  const { userData, isAdmin } = useAuth();

  const planType = useMemo(() => {
    if (isAdmin) return PlanType.MASTER; // Admins have everything
    return (userData?.plan as PlanType) || PlanType.FREE;
  }, [userData?.plan, isAdmin]);

  const planConfig = useMemo(() => {
    return PLAN_CONFIGS[planType] || PLAN_CONFIGS[PlanType.FREE];
  }, [planType]);

  const hasFeature = (feature: keyof PlanConfig['limits']) => {
    return !!planConfig.limits[feature];
  };

  const getLimit = <K extends keyof PlanConfig['limits']>(key: K): PlanConfig['limits'][K] => {
    return planConfig.limits[key];
  };

  const canAddClient = (currentCount: number) => {
    return currentCount < planConfig.limits.maxClients;
  };

  return {
    planType,
    plan: planConfig,
    hasFeature,
    getLimit,
    canAddClient,
    isFree: planType === PlanType.FREE,
    isPro: planType === PlanType.PRO,
    isMaster: planType === PlanType.MASTER,
  };
}
