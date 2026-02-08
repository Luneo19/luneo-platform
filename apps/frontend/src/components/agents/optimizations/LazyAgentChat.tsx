/**
 * Composant lazy-loaded pour chat agents
 * Optimisation: Charge seulement quand nécessaire
 */

'use client';

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load composants lourds
const LunaChat = lazy(() => import('../luna/LunaChat').then(m => ({ default: m.LunaChat })));
const AriaWidget = lazy(() => import('../aria/AriaWidget').then(m => ({ default: m.AriaWidget })));
// NovaChat component not yet implemented
// const NovaChat = lazy(() => import('../nova/NovaChat').then(m => ({ default: m.NovaChat })));

interface LazyAgentChatProps {
  agent: 'luna' | 'aria' | 'nova';
  [key: string]: unknown;
}

export function LazyAgentChat({ agent, ...props }: LazyAgentChatProps) {
  const LoadingSkeleton = () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );

  if (agent === 'luna') {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <LunaChat {...(props as Record<string, unknown>)} />
      </Suspense>
    );
  }

  if (agent === 'aria' || agent === 'nova') {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <AriaWidget {...(props as Record<string, unknown>)} />
      </Suspense>
    );
  }

  return null;
}
