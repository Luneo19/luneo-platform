'use client';

import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useEffect, useRef, useState } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import type { AffiliateLink, AffiliateStats, Commission, Referral } from '../types';
import { MIN_PAYOUT_THRESHOLD } from '../constants';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

const initialStats: AffiliateStats = {
  totalReferrals: 0,
  activeReferrals: 0,
  totalConversions: 0,
  totalRevenue: 0,
  totalCommissions: 0,
  pendingCommissions: 0,
  paidCommissions: 0,
  conversionRate: 0,
  averageCommission: 0,
  clickThroughRate: 0,
  topReferral: null,
};

export function useAffiliatePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const tRef = useRef(t);
  tRef.current = t;
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState<AffiliateStats>(initialStats);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await endpoints.referral.stats();
      const raw = data as Record<string, unknown>;

      // Map backend response to frontend types
      const referralCode = (raw.referralCode as string) || '';
      const referralLink = (raw.referralLink as string) || `${APP_BASE_URL}?ref=${referralCode}`;
      const totalReferrals = (raw.totalReferrals as number) || 0;
      const activeReferrals = (raw.activeReferrals as number) || 0;
      const totalEarnings = (raw.totalEarnings as number) || 0;
      const pendingEarnings = (raw.pendingEarnings as number) || 0;
      const recentReferrals = (raw.recentReferrals as Array<Record<string, unknown>>) || [];

      // Build affiliate link from referral code
      if (referralCode) {
        setAffiliateLinks([
          {
            id: 'main',
            code: referralCode,
            url: referralLink,
            name: 'Lien principal',
            clicks: 0,
            conversions: totalReferrals - activeReferrals,
            revenue: totalEarnings,
            createdAt: new Date(),
            isActive: true,
          },
        ]);
      }

      // Map recent referrals
      const mappedReferrals: Referral[] = recentReferrals.map((r, index) => ({
        id: (r.id as string) || String(index),
        email: (r.email as string) || '',
        name: (r.name as string) || 'Utilisateur',
        status: ((r.status as string) || 'active') as Referral['status'],
        signupDate: r.signupDate ? new Date(r.signupDate as string) : new Date(),
        conversionDate: r.conversionDate ? new Date(r.conversionDate as string) : undefined,
        revenue: (r.revenue as number) || 0,
        commission: (r.commission as number) || 0,
        linkCode: referralCode,
      }));
      setReferrals(mappedReferrals);

      // Calculate stats
      const totalConversions = mappedReferrals.filter((r) => r.status === 'converted').length;
      const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;
      const totalCommissions = totalEarnings + pendingEarnings;
      const averageCommission = totalReferrals > 0 ? totalCommissions / totalReferrals : 0;

      setStats({
        totalReferrals,
        activeReferrals,
        totalConversions,
        totalRevenue: totalEarnings,
        totalCommissions,
        pendingCommissions: pendingEarnings,
        paidCommissions: totalEarnings,
        conversionRate,
        averageCommission,
        clickThroughRate: 0,
        topReferral: mappedReferrals.length > 0
          ? mappedReferrals.reduce((top, r) => (r.revenue > (top?.revenue || 0) ? r : top), null as Referral | null)
          : null,
      });

      // Map commissions from referrals
      const mappedCommissions: Commission[] = mappedReferrals
        .filter((r) => r.commission > 0)
        .map((r) => ({
          id: `comm-${r.id}`,
          referralId: r.id,
          referralEmail: r.email,
          amount: r.commission,
          status: r.status === 'converted' ? ('paid' as const) : ('pending' as const),
          createdAt: r.signupDate,
          paidAt: r.conversionDate,
          description: `Commission pour ${r.name}`,
        }));
      setCommissions(mappedCommissions);
    } catch (error: unknown) {
      logger.error('Error fetching affiliate data', { error });
      toastRef.current({
        title: tRef.current('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyLink = useCallback(
    (link: AffiliateLink) => {
      navigator.clipboard.writeText(link.url);
      toastRef.current({
        title: tRef.current('affiliate.linkCopied'),
        description: tRef.current('common.copied'),
      });
    },
    []
  );

  const handleCreateLink = useCallback(async () => {
    try {
      const data = await endpoints.referral.stats();
      const raw = data as Record<string, unknown>;
      const referralCode = (raw.referralCode as string) || '';
      const referralLink = (raw.referralLink as string) || `${APP_BASE_URL}?ref=${referralCode}`;

      if (referralLink) {
        await navigator.clipboard.writeText(referralLink);
      }

      toastRef.current({
        title: tRef.current('affiliate.linkCopied'),
        description: referralLink || tRef.current('affiliate.createLink'),
      });

      await fetchData();
      setShowCreateLinkModal(false);
    } catch (error: unknown) {
      logger.error('Error creating affiliate link', { error });
      toastRef.current({
        title: tRef.current('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    }
  }, [fetchData]);

  const handleRequestPayout = useCallback(async () => {
    try {
      await endpoints.referral.withdraw();
      toastRef.current({
        title: tRef.current('common.success'),
        description: tRef.current('affiliate.payoutRequested'),
      });
      setShowPayoutModal(false);
      fetchData();
    } catch (error: unknown) {
      logger.error('Error requesting payout', { error });
      toastRef.current({
        title: tRef.current('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    }
  }, [fetchData]);

  return {
    loading,
    activeTab,
    setActiveTab,
    showCreateLinkModal,
    setShowCreateLinkModal,
    showPayoutModal,
    setShowPayoutModal,
    filterStatus,
    setFilterStatus,
    stats,
    affiliateLinks,
    referrals,
    commissions,
    handleCopyLink,
    handleCreateLink,
    handleRequestPayout,
    minPayoutThreshold: MIN_PAYOUT_THRESHOLD,
  };
}
