import { useAuth } from './AuthContext';

export type PlanType = 'free' | 'pro' | 'master';

export function usePlan() {
  const { userData, isAdmin } = useAuth();
  
  const plan: PlanType = userData?.plan || 'free';
  
  const isFree = plan === 'free';
  const isPro = plan === 'pro';
  const isMaster = plan === 'master';
  
  // Feature flags
  const canAccessAdmin = isAdmin || isMaster;
  const canExportPDF = isPro || isMaster;
  const canCustomLogo = isMaster;
  
  const maxClients = isMaster ? Infinity : (isPro ? 50 : 2);
  
  return {
    plan,
    isFree,
    isPro,
    isMaster,
    canAccessAdmin,
    canExportPDF,
    canCustomLogo,
    maxClients,
    currentClientCount: userData?.clientCount || 0
  };
}
