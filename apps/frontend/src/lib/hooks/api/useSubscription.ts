/**
 * ★★★ HOOK - SUBSCRIPTION & PLAN (React Query) ★★★
 * Hooks React Query pour gérer l'abonnement et les plans
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise';

export interface PlanLimits {
  designsPerMonth: number | -1; // -1 = illimité
  teamMembers: number | -1;
  storageGB: number | -1;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customExport: boolean;
  whiteLabel: boolean;
}

export interface SubscriptionInfo {
  plan: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  limits: PlanLimits;
  currentUsage?: {
    designs: number;
    renders2D: number;
    renders3D: number;
    storageGB: number;
    apiCalls: number;
    teamMembers: number;
  };
  expiresAt?: string;
  stripeSubscriptionId?: string;
}

/**
 * Hook pour récupérer l'information d'abonnement de l'utilisateur
 */
export function useSubscription(
  options?: Omit<UseQueryOptions<SubscriptionInfo>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SubscriptionInfo>({
    queryKey: ['subscription', 'current'],
    queryFn: async () => {
      try {
        // Utiliser l'endpoint billing/subscription
        const subscription = await endpoints.billing.subscription();
        
        // Si l'endpoint retourne directement les données
        if (subscription && 'plan' in subscription) {
          return subscription as SubscriptionInfo;
        }
        
        // Fallback : récupérer depuis /api/v1/auth/me si user.plan existe
        // Pour l'instant, retourner un plan par défaut (STARTER)
        // TODO: Implémenter l'endpoint backend /api/v1/billing/subscription
        return {
          plan: 'starter' as PlanTier,
          status: 'active' as const,
          limits: {
            designsPerMonth: 50,
            teamMembers: 3,
            storageGB: 5,
            apiAccess: false,
            advancedAnalytics: false,
            prioritySupport: false,
            customExport: false,
            whiteLabel: false,
          },
        };
      } catch (error) {
        logger.error('Failed to fetch subscription', { error });
        
        // En cas d'erreur, retourner un plan par défaut
        return {
          plan: 'starter' as PlanTier,
          status: 'active' as const,
          limits: {
            designsPerMonth: 50,
            teamMembers: 3,
            storageGB: 5,
            apiAccess: false,
            advancedAnalytics: false,
            prioritySupport: false,
            customExport: false,
            whiteLabel: false,
          },
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

/**
 * Hook pour vérifier si l'utilisateur a accès à une fonctionnalité
 */
export function useHasFeature(
  feature: keyof PlanLimits,
  options?: Omit<UseQueryOptions<boolean>, 'queryKey' | 'queryFn'>
) {
  const { data: subscription } = useSubscription();
  
  return useQuery<boolean>({
    queryKey: ['subscription', 'hasFeature', feature],
    queryFn: () => {
      if (!subscription) return false;
      return Boolean(subscription.limits[feature]);
    },
    enabled: !!subscription && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook pour vérifier si l'utilisateur a un plan minimum
 */
export function useHasMinimumPlan(
  minimumPlan: PlanTier,
  options?: Omit<UseQueryOptions<boolean>, 'queryKey' | 'queryFn'>
) {
  const { data: subscription } = useSubscription();
  
  const planHierarchy: Record<PlanTier, number> = {
    starter: 1,
    professional: 2,
    business: 3,
    enterprise: 4,
  };
  
  return useQuery<boolean>({
    queryKey: ['subscription', 'hasMinimumPlan', minimumPlan],
    queryFn: () => {
      if (!subscription) return false;
      const userPlanLevel = planHierarchy[subscription.plan] || 0;
      const requiredLevel = planHierarchy[minimumPlan] || 0;
      return userPlanLevel >= requiredLevel;
    },
    enabled: !!subscription && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}
