/**
 * ★★★ HOOK - SUBSCRIPTION & PLAN (React Query) ★★★
 * Hooks React Query pour gérer l'abonnement et les plans
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export type PlanTier = 'free' | 'pro' | 'business' | 'enterprise';

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
        const response = await endpoints.billing.subscription();
        
        // L'endpoint retourne directement les données SubscriptionInfo
        // Gérer différents formats de réponse possibles
        let subscription: SubscriptionInfo;
        
        if (response && typeof response === 'object') {
          // Si la réponse contient directement les propriétés de SubscriptionInfo
          if ('plan' in response && 'status' in response && 'limits' in response) {
            subscription = response as SubscriptionInfo;
          } 
          // Si la réponse est encapsulée dans un objet data ou subscription
          else if ('data' in response && response.data && typeof response.data === 'object' && 'plan' in response.data) {
            subscription = response.data as SubscriptionInfo;
          }
          else if ('subscription' in response && response.subscription && typeof response.subscription === 'object' && 'plan' in response.subscription) {
            subscription = response.subscription as SubscriptionInfo;
          }
          else {
            throw new Error('Invalid subscription response format');
          }
          
          return subscription;
        }
        
        throw new Error('Empty subscription response');
      } catch (error: unknown) {
        logger.error(
          'Failed to fetch subscription',
          error instanceof Error ? error : new Error(String(error))
        );
        
        // En cas d'erreur (404, pas d'abonnement, etc.), retourner un plan par défaut
        // Cela permet à l'application de continuer à fonctionner même sans abonnement actif
        return {
          plan: 'free' as PlanTier,
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
    free: 0,
    pro: 1,
    business: 2,
    enterprise: 3,
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
