/**
 * ★★★ HOOK - FEATURE GATE (Composants & Helpers) ★★★
 * Hooks et composants pour gérer le feature gating dans l'UI
 */

import { ReactNode } from 'react';
import { useSubscription, useHasFeature, useHasMinimumPlan, type PlanTier } from './useSubscription';
import { logger } from '@/lib/logger';

/**
 * Hook pour vérifier si une fonctionnalité est accessible
 * Retourne { hasAccess, isUpgradeRequired, upgradePlan }
 */
export function useFeatureGate(feature: keyof import('./useSubscription').PlanLimits) {
  const { data: subscription, isLoading } = useSubscription();
  const { data: hasFeature, isLoading: isLoadingFeature } = useHasFeature(feature, {
    enabled: !!subscription,
  });

  // Déterminer le plan minimum requis pour cette fonctionnalité
  const getRequiredPlan = (feature: string): PlanTier | null => {
    const featurePlanMap: Record<string, PlanTier> = {
      apiAccess: 'professional',
      advancedAnalytics: 'business',
      customExport: 'business',
      whiteLabel: 'professional',
      prioritySupport: 'professional',
    };
    return featurePlanMap[feature] || null;
  };

  const requiredPlan = getRequiredPlan(feature);
  const hasAccess = Boolean(hasFeature);
  const isUpgradeRequired = !hasAccess && requiredPlan !== null;

  return {
    hasAccess,
    isUpgradeRequired,
    upgradePlan: requiredPlan,
    currentPlan: subscription?.plan,
    isLoading: isLoading || isLoadingFeature,
  };
}

/**
 * Hook pour vérifier si un plan minimum est requis
 */
export function usePlanGate(minimumPlan: PlanTier) {
  const { data: subscription, isLoading } = useSubscription();
  const { data: hasMinimumPlan, isLoading: isLoadingPlan } = useHasMinimumPlan(minimumPlan, {
    enabled: !!subscription,
  });

  return {
    hasAccess: Boolean(hasMinimumPlan),
    isUpgradeRequired: !hasMinimumPlan,
    currentPlan: subscription?.plan,
    requiredPlan: minimumPlan,
    isLoading: isLoading || isLoadingPlan,
  };
}

/**
 * Hook pour vérifier les quotas d'usage
 * Vérifie si l'utilisateur peut encore utiliser une ressource
 */
export function useQuotaGate(metric: 'designs' | 'renders2D' | 'renders3D' | 'storage' | 'apiCalls' | 'teamMembers') {
  const { data: subscription, isLoading } = useSubscription();
  
  // Mapper metric vers limits
  const metricMap: Record<string, keyof import('./useSubscription').PlanLimits> = {
    designs: 'designsPerMonth',
    teamMembers: 'teamMembers',
    storage: 'storageGB',
  };

  const limitKey = metricMap[metric];
  const limit = subscription?.limits?.[limitKey];
  const usage = (subscription?.currentUsage || {}) as {
    designs?: number;
    renders2D?: number;
    renders3D?: number;
    storageGB?: number;
    apiCalls?: number;
    teamMembers?: number;
  };
  const currentUsage = (metric === 'designs' ? usage.designs : metric === 'teamMembers' ? usage.teamMembers : metric === 'storage' ? usage.storageGB : metric === 'renders2D' ? usage.renders2D : metric === 'renders3D' ? usage.renders3D : metric === 'apiCalls' ? usage.apiCalls : 0) || 0;

  // -1 = illimité
  const hasUnlimited = limit === -1;
  const remaining = hasUnlimited ? Infinity : Math.max(0, Number(limit) - currentUsage);
  const hasQuota = hasUnlimited || remaining > 0;

  return {
    hasQuota,
    limit: hasUnlimited ? Infinity : Number(limit),
    currentUsage,
    remaining,
    isLoading,
  };
}

/**
 * Composant pour cacher/afficher du contenu selon une fonctionnalité
 */
interface FeatureGateProps {
  feature: keyof import('./useSubscription').PlanLimits;
  fallback?: ReactNode;
  children: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({ feature, fallback = null, children, showUpgradePrompt = false }: FeatureGateProps) {
  const { hasAccess, isUpgradeRequired, upgradePlan } = useFeatureGate(feature);

  if (!hasAccess && isUpgradeRequired) {
    if (showUpgradePrompt && fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * Composant pour cacher/afficher du contenu selon un plan minimum
 */
interface PlanGateProps {
  minimumPlan: PlanTier;
  fallback?: ReactNode;
  children: ReactNode;
  showUpgradePrompt?: boolean;
}

export function PlanGate({ minimumPlan, fallback = null, children, showUpgradePrompt = false }: PlanGateProps) {
  const { hasAccess, isUpgradeRequired } = usePlanGate(minimumPlan);

  if (!hasAccess && isUpgradeRequired) {
    if (showUpgradePrompt && fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook utilitaire pour obtenir le texte de promotion selon le plan
 */
export function useUpgradePrompt(requiredPlan: PlanTier) {
  const planMessages: Record<PlanTier, { title: string; description: string; cta: string }> = {
    starter: {
      title: 'Passer à Starter',
      description: 'Débloquez plus de fonctionnalités avec le plan Starter',
      cta: 'Essayer Starter',
    },
    professional: {
      title: 'Upgrade vers Professional',
      description: 'Accédez à l\'API, au branding personnalisé et au support prioritaire',
      cta: 'Passer à Professional',
    },
    business: {
      title: 'Upgrade vers Business',
      description: 'Analytics avancées, export personnalisé et toutes les fonctionnalités',
      cta: 'Passer à Business',
    },
    enterprise: {
      title: 'Contactez-nous',
      description: 'Solution sur-mesure avec toutes les fonctionnalités illimitées',
      cta: 'Contacter les ventes',
    },
  };

  return planMessages[requiredPlan] || planMessages.professional;
}
