/**
 * ★★★ COMPOSANT - UPGRADE PROMPT ★★★
 * Composant réutilisable pour afficher les prompts de mise à niveau de plan
 */

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Crown, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useUpgradePrompt } from '@/lib/hooks/api/useFeatureGate';
import type { PlanTier } from '@/lib/hooks/api/useSubscription';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  requiredPlan: PlanTier;
  feature?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
  showIcon?: boolean;
}

const planIcons: Record<PlanTier, typeof Sparkles> = {
  free: Sparkles,
  starter: Sparkles,
  professional: Zap,
  business: Crown,
  enterprise: Building2,
};

const planColors: Record<PlanTier, string> = {
  free: 'border-gray-500/20 bg-gray-500/5',
  starter: 'border-cyan-500/20 bg-cyan-500/5',
  professional: 'border-purple-500/20 bg-purple-500/5',
  business: 'border-amber-500/20 bg-amber-500/5',
  enterprise: 'border-rose-500/20 bg-rose-500/5',
};

/**
 * Composant UpgradePrompt - Affiche un prompt pour passer à un plan supérieur
 */
export function UpgradePrompt({
  requiredPlan,
  feature,
  description,
  className,
  variant = 'default',
  showIcon = true,
}: UpgradePromptProps) {
  const prompt = useUpgradePrompt(requiredPlan);
  const Icon = planIcons[requiredPlan];
  const colorClass = planColors[requiredPlan];

  // Variant compact (pour sidebar, tooltips)
  if (variant === 'compact') {
    return (
      <div className={cn('p-4 rounded-lg border', colorClass, className)}>
        <div className="flex items-start gap-3">
          {showIcon && Icon && (
            <div className="mt-0.5">
              <Icon className="w-5 h-5 text-current opacity-60" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1">{prompt.title}</h4>
            <p className="text-xs text-muted-foreground mb-3">{description || prompt.description}</p>
            <Link href={`/pricing?plan=${requiredPlan}`}>
              <Button size="sm" variant="default" className="w-full">
                {prompt.cta}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Variant inline (pour les tableaux, listes)
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-between p-3 rounded-md border', colorClass, className)}>
        <div className="flex items-center gap-2">
          {showIcon && Icon && <Icon className="w-4 h-4 text-current opacity-60" />}
          <div>
            <p className="text-sm font-medium">{prompt.title}</p>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        <Link href={`/pricing?plan=${requiredPlan}`}>
          <Button size="sm" variant="outline">
            {prompt.cta}
          </Button>
        </Link>
      </div>
    );
  }

  // Variant default (carte complète)
  return (
    <Card className={cn('border-2', colorClass, className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {showIcon && Icon && (
              <div className="p-2 rounded-lg bg-background/50">
                <Icon className="w-6 h-6 text-current" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{prompt.title}</CardTitle>
              <CardDescription className="mt-1">
                {description || prompt.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="ml-2">
            {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      {feature && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cette fonctionnalité nécessite le plan <strong>{requiredPlan}</strong> ou supérieur.
          </p>
        </CardContent>
      )}
      <CardFooter className="flex items-center justify-between pt-4">
        <p className="text-xs text-muted-foreground">
          Découvrez tous les avantages du plan {requiredPlan}
        </p>
        <Link href={`/pricing?plan=${requiredPlan}`}>
          <Button>
            {prompt.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

/**
 * Composant FeatureLocked - Version simple pour bloquer une fonctionnalité
 */
interface FeatureLockedProps {
  feature: string;
  requiredPlan: PlanTier;
  className?: string;
}

export function FeatureLocked({ feature, requiredPlan, className }: FeatureLockedProps) {
  return (
    <div className={cn('flex items-center justify-center p-8 rounded-lg border-2 border-dashed', className)}>
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{feature}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Cette fonctionnalité nécessite le plan <strong>{requiredPlan}</strong> ou supérieur.
        </p>
        <Link href={`/pricing?plan=${requiredPlan}`}>
          <Button variant="default">
            Passer à {requiredPlan}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
