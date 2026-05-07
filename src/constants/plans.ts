import { PlanType } from '@/types/enums';

export interface PlanFeature {
  name: string;
  description: string;
  enabled: boolean;
}

export interface PlanConfig {
  id: PlanType;
  name: string;
  limits: {
    maxClients: number;
    maxTeams: number;
    aiInsights: boolean;
    googleCalendar: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  [PlanType.FREE]: {
    id: PlanType.FREE,
    name: 'Gratuito',
    limits: {
      maxClients: 3,
      maxTeams: 0,
      aiInsights: false,
      googleCalendar: false,
      prioritySupport: false,
      customBranding: false,
    }
  },
  [PlanType.PRO]: {
    id: PlanType.PRO,
    name: 'Profissional',
    limits: {
      maxClients: 20,
      maxTeams: 1,
      aiInsights: true,
      googleCalendar: true,
      prioritySupport: false,
      customBranding: false,
    }
  },
  [PlanType.MASTER]: {
    id: PlanType.MASTER,
    name: 'Master',
    limits: {
      maxClients: 999999, // Infinity
      maxTeams: 5,
      aiInsights: true,
      googleCalendar: true,
      prioritySupport: true,
      customBranding: true,
    }
  }
};
