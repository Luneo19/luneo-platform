'use client';

import { useToast } from '@/hooks/use-toast';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AffiliateLink, AffiliateStats, Commission, Referral } from '../types';
import { MIN_PAYOUT_THRESHOLD } from '../constants';

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState<AffiliateStats>(initialStats);

  const affiliateLinks: AffiliateLink[] = useMemo(
    () => [
      {
        id: '1',
        code: 'REF123',
        url: 'https://luneo.com?ref=REF123',
        name: 'Lien principal',
        clicks: 1250,
        conversions: 45,
        revenue: 2250,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        id: '2',
        code: 'REF456',
        url: 'https://luneo.com?ref=REF456',
        name: 'Lien blog',
        clicks: 890,
        conversions: 28,
        revenue: 1400,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ],
    []
  );

  const referrals: Referral[] = useMemo(
    () => [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'Jean Dupont',
        status: 'converted',
        signupDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        conversionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        revenue: 500,
        commission: 100,
        linkCode: 'REF123',
      },
      {
        id: '2',
        email: 'user2@example.com',
        name: 'Marie Martin',
        status: 'active',
        signupDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        revenue: 0,
        commission: 0,
        linkCode: 'REF123',
      },
    ],
    []
  );

  const commissions: Commission[] = useMemo(
    () => [
      {
        id: '1',
        referralId: '1',
        referralEmail: 'user1@example.com',
        amount: 100,
        status: 'paid',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Commission pour conversion',
      },
      {
        id: '2',
        referralId: '2',
        referralEmail: 'user2@example.com',
        amount: 50,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Commission en attente',
      },
    ],
    []
  );

  useEffect(() => {
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter((r) => r.status === 'active' || r.status === 'converted').length;
    const totalConversions = referrals.filter((r) => r.status === 'converted').length;
    const totalRevenue = referrals.reduce((acc, r) => acc + r.revenue, 0);
    const totalCommissions = commissions.reduce((acc, c) => acc + c.amount, 0);
    const pendingCommissions = commissions.filter((c) => c.status === 'pending').reduce((acc, c) => acc + c.amount, 0);
    const paidCommissions = commissions.filter((c) => c.status === 'paid').reduce((acc, c) => acc + c.amount, 0);
    const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;
    const averageCommission = commissions.length > 0 ? totalCommissions / commissions.length : 0;
    const totalClicks = affiliateLinks.reduce((acc, l) => acc + l.clicks, 0);
    const clickThroughRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const topReferral = referrals.reduce((top, r) => (r.revenue > (top?.revenue || 0) ? r : top), null as Referral | null);

    setStats({
      totalReferrals,
      activeReferrals,
      totalConversions,
      totalRevenue,
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      conversionRate,
      averageCommission,
      clickThroughRate,
      topReferral,
    });
  }, [referrals, commissions, affiliateLinks]);

  const handleCopyLink = useCallback(
    (link: AffiliateLink) => {
      navigator.clipboard.writeText(link.url);
      toast({
        title: 'Lien copié',
        description: "Le lien de parrainage a été copié dans le presse-papiers",
      });
    },
    [toast]
  );

  const handleCreateLink = useCallback(() => {
    toast({
      title: 'Lien créé',
      description: "Votre nouveau lien de parrainage a été créé",
    });
    setShowCreateLinkModal(false);
  }, [toast]);

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
    minPayoutThreshold: MIN_PAYOUT_THRESHOLD,
  };
}
