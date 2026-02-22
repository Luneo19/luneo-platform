'use client';

/**
 * Client Component pour le Dashboard Principal
 * Délègue tout le contenu adaptatif au DashboardShell (KPIs, widgets, personnalisation).
 */

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { DashboardShell } from './DashboardShell';

interface DashboardPageClientProps {
  initialNotifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }>;
}

export function DashboardPageClient({
  initialNotifications,
}: DashboardPageClientProps) {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('credits_purchase') === 'success') {
      toast({
        title: t('creditsToast.creditsPurchased'),
        description: t('creditsToast.creditsPurchasedDesc'),
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('credits_purchase');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, toast, t]);

  return <DashboardShell initialNotifications={initialNotifications} />;
}

