'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { endpoints } from '@/lib/api/client';
import type { CreditPack, CreditTransaction, CreditStats, CreditsTab } from '../components/types';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';

const INITIAL_STATS: CreditStats = {
  currentBalance: 0,
  totalPurchased: 0,
  totalUsed: 0,
  totalRefunded: 0,
  totalBonus: 0,
  usageRate: 0,
  avgCostPerGeneration: 0,
  totalGenerations: 0,
  byType: {},
  byEndpoint: {},
  byModel: {},
  trends: [],
};

function normalizePack(raw: Record<string, unknown>): CreditPack {
  const priceCents = Number(raw.priceCents ?? raw.price_cents ?? 0);
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    credits: Number(raw.credits ?? 0),
    priceCents,
    price: priceCents / 100,
    stripePriceId: raw.stripePriceId != null ? String(raw.stripePriceId) : undefined,
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    isFeatured: Boolean(raw.isFeatured ?? raw.is_featured ?? false),
    savings: raw.savings != null ? Number(raw.savings) : undefined,
    badge: raw.badge != null ? String(raw.badge) : undefined,
    description: raw.description != null ? String(raw.description) : undefined,
    features: Array.isArray(raw.features) ? raw.features.map(String) : undefined,
  };
}

function normalizeTransaction(raw: Record<string, unknown>): CreditTransaction {
  const pack = raw.pack as Record<string, unknown> | undefined;
  const createdAt = raw.createdAt ?? raw.created_at;
  return {
    id: String(raw.id ?? ''),
    type: (raw.type as CreditTransaction['type']) ?? 'usage',
    amount: Number(raw.amount ?? 0),
    balanceBefore: Number(raw.balanceBefore ?? raw.balance_before ?? 0),
    balanceAfter: Number(raw.balanceAfter ?? raw.balance_after ?? 0),
    source: raw.source != null ? String(raw.source) : undefined,
    metadata: (raw.metadata as Record<string, unknown>) ?? undefined,
    packId: raw.packId != null ? String(raw.packId) : undefined,
    packName: pack ? String(pack.name ?? '') : (raw.packName != null ? String(raw.packName) : undefined),
    createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt as string | number),
  };
}

export function useCreditsPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAutoRefillModal, setShowAutoRefillModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<CreditsTab>('overview');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('30d');
  const [autoRefillEnabled, setAutoRefillEnabled] = useState(false);
  const [autoRefillThreshold, setAutoRefillThreshold] = useState(100);
  const [autoRefillPack, setAutoRefillPack] = useState<string | null>(null);
  const [stats, setStats] = useState<CreditStats>(INITIAL_STATS);
  const [balanceFromApi, setBalanceFromApi] = useState<number | null>(null);

  const fetchPacks = useCallback(async () => {
    try {
      const response = await endpoints.credits.packs();
      const data = response as { packs?: unknown[] } | unknown[];
      const list = Array.isArray(data) ? data : (data?.packs ?? []);
      const normalized = (list || []).map((p) => normalizePack(p as Record<string, unknown>));
      setCreditPacks(normalized);
      return normalized;
    } catch (err) {
      logger.error('Failed to fetch credit packs', err);
      setCreditPacks([]);
      setError(err instanceof Error ? err.message : t('credits.errorLoadPacks'));
      return [];
    }
  }, [t]);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await endpoints.credits.transactions({ limit: 100, offset: 0 });
      const data = response as { transactions?: unknown[] };
      const list = data?.transactions ?? [];
      const normalized = (Array.isArray(list) ? list : []).map((t) =>
        normalizeTransaction(t as Record<string, unknown>)
      );
      setTransactions(normalized);
      return normalized;
    } catch (err) {
      logger.error('Failed to fetch transactions', err);
      setTransactions([]);
      setError(err instanceof Error ? err.message : t('credits.errorLoadHistory'));
      return [];
    }
  }, [t]);

  const fetchBalance = useCallback(async () => {
    try {
      const balanceData = await endpoints.credits.balance();
      const data = balanceData as { balance?: number; credits?: number };
      const balance = data?.balance ?? data?.credits ?? 0;
      setBalanceFromApi(balance);
      return balance;
    } catch (err) {
      logger.error('Failed to fetch balance', err);
      setBalanceFromApi(null);
      return 0;
    }
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([fetchBalance(), fetchPacks(), fetchTransactions()]).finally(() => setLoading(false));
  }, [fetchBalance, fetchPacks, fetchTransactions]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchBalance(), fetchPacks(), fetchTransactions()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchBalance, fetchPacks, fetchTransactions]);

  useEffect(() => {
    const currentBalance =
      balanceFromApi !== null ? balanceFromApi : transactions.reduce((acc, t) => acc + t.amount, 0);
    const totalPurchased = transactions.filter((t) => t.type === 'purchase').reduce((acc, t) => acc + t.amount, 0);
    const totalUsed = Math.abs(transactions.filter((t) => t.type === 'usage').reduce((acc, t) => acc + t.amount, 0));
    const totalRefunded = transactions.filter((t) => t.type === 'refund').reduce((acc, t) => acc + t.amount, 0);
    const totalBonus = transactions.filter((t) => t.type === 'bonus').reduce((acc, t) => acc + t.amount, 0);
    const usageRate = totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0;
    const totalGenerations = transactions.filter((t) => t.type === 'usage').length;
    const avgCostPerGeneration = totalGenerations > 0 ? totalUsed / totalGenerations : 0;
    const byType: Record<string, number> = {};
    const byEndpoint: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    transactions.forEach((t) => {
      byType[t.type] = (byType[t.type] || 0) + Math.abs(t.amount);
      if (t.source) byEndpoint[t.source] = (byEndpoint[t.source] || 0) + Math.abs(t.amount);
      if (t.metadata && typeof t.metadata === 'object' && 'model' in t.metadata)
        byModel[String((t.metadata as { model?: string }).model)] =
          (byModel[String((t.metadata as { model?: string }).model)] || 0) + Math.abs(t.amount);
    });
    setStats({
      currentBalance,
      totalPurchased,
      totalUsed,
      totalRefunded,
      totalBonus,
      usageRate,
      avgCostPerGeneration,
      totalGenerations,
      byType,
      byEndpoint,
      byModel,
      trends: [],
    });
  }, [transactions, balanceFromApi]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (filterType !== 'all') filtered = filtered.filter((t) => t.type === filterType);
    const dateRanges: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    if (filterDateRange !== 'all' && dateRanges[filterDateRange]) {
      const daysAgo = new Date(Date.now() - dateRanges[filterDateRange] * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((t) => t.createdAt >= daysAgo);
    }
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [transactions, filterType, filterDateRange]);

  const handlePurchase = useCallback((packId: string) => {
    setSelectedPack(packId);
    setShowPurchaseModal(true);
  }, []);

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedPack) return;
    const pack = creditPacks.find((p) => p.id === selectedPack);
    if (!pack) {
      toast({ title: t('common.error'), description: t('credits.errorPackNotFound'), variant: 'destructive' });
      return;
    }
    try {
      const data = await endpoints.credits.buy({ packSize: pack.credits });
      const payload = data as { url?: string };
      if (payload?.url) window.location.href = payload.url;
      else toast({ title: t('common.error'), description: t('credits.errorPaymentUrl'), variant: 'destructive' });
    } catch (error: unknown) {
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    }
  }, [selectedPack, creditPacks, toast, t]);

  const handleEnableAutoRefill = useCallback(() => {
    if (!autoRefillPack) {
      toast({ title: t('common.error'), description: t('credits.errorSelectPack'), variant: 'destructive' });
      return;
    }
    setAutoRefillEnabled(true);
    setShowAutoRefillModal(false);
    toast({ title: t('common.success'), description: t('credits.autoRefillEnabledSuccess') });
  }, [autoRefillPack, toast]);

  return {
    loading,
    creditPacks,
    transactions,
    filteredTransactions,
    stats,
    activeTab,
    setActiveTab,
    filterType,
    setFilterType,
    filterDateRange,
    setFilterDateRange,
    autoRefillEnabled,
    setAutoRefillEnabled,
    autoRefillThreshold,
    setAutoRefillThreshold,
    autoRefillPack,
    setAutoRefillPack,
    showPurchaseModal,
    setShowPurchaseModal,
    showAutoRefillModal,
    setShowAutoRefillModal,
    showExportModal,
    setShowExportModal,
    selectedPack,
    setSelectedPack,
    handlePurchase,
    handleConfirmPurchase,
    handleEnableAutoRefill,
  };
}
