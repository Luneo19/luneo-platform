'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import { formatNumber, formatPrice, formatRelativeDate } from '@/lib/utils/formatters';
import type { CreditPack, CreditTransaction, CreditStats, CreditsTab } from '../components/types';

const MOCK_PACKS: CreditPack[] = [
  { id: 'pack-100', name: 'Pack 100', credits: 100, priceCents: 1900, price: 19, isActive: true, isFeatured: false, description: 'Idéal pour tester', features: ['100 crédits', 'Valable 6 mois', 'Support email'] },
  { id: 'pack-500', name: 'Pack 500', credits: 500, priceCents: 7900, price: 79, isActive: true, isFeatured: true, savings: 20, badge: 'Meilleur rapport', description: 'Le plus populaire', features: ['500 crédits', 'Valable 12 mois', 'Support prioritaire', 'Économie de 20%'] },
  { id: 'pack-1000', name: 'Pack 1000', credits: 1000, priceCents: 13900, price: 139, isActive: true, isFeatured: false, savings: 30, badge: 'Meilleure valeur', description: 'Pour les utilisateurs intensifs', features: ['1000 crédits', 'Valable 12 mois', 'Support prioritaire', 'Économie de 30%'] },
];

const MOCK_TRANSACTIONS: CreditTransaction[] = [
  { id: '1', type: 'purchase', amount: 500, balanceBefore: 0, balanceAfter: 500, packId: 'pack-500', packName: 'Pack 500', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: '2', type: 'usage', amount: -50, balanceBefore: 500, balanceAfter: 450, source: '/api/ai/generate-2d', metadata: { model: 'dalle-3', cost: 50 }, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
  { id: '3', type: 'usage', amount: -100, balanceBefore: 450, balanceAfter: 350, source: '/api/ai/generate-3d', metadata: { model: 'midjourney', cost: 100 }, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: '4', type: 'bonus', amount: 100, balanceBefore: 350, balanceAfter: 450, source: 'referral', metadata: { referralCode: 'REF123' }, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
];

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

export function useCreditsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
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

  const creditPacks = useMemo(() => MOCK_PACKS, []);
  const transactions = useMemo(() => MOCK_TRANSACTIONS, []);

  useEffect(() => {
    const currentBalance = transactions.reduce((acc, t) => acc + t.amount, 0);
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
      if (t.metadata && typeof t.metadata === 'object' && 'model' in t.metadata) byModel[String((t.metadata as { model?: string }).model)] = (byModel[String((t.metadata as { model?: string }).model)] || 0) + Math.abs(t.amount);
    });
    setStats({ currentBalance, totalPurchased, totalUsed, totalRefunded, totalBonus, usageRate, avgCostPerGeneration, totalGenerations, byType, byEndpoint, byModel, trends: [] });
  }, [transactions]);

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
    if (!creditPacks.find((p) => p.id === packId)) return;
    setSelectedPack(packId);
    setShowPurchaseModal(true);
  }, [creditPacks]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedPack) return;
    const pack = creditPacks.find((p) => p.id === selectedPack);
    if (!pack) {
      toast({ title: 'Erreur', description: 'Pack introuvable', variant: 'destructive' });
      return;
    }
    try {
      const data = await endpoints.credits.buy({ packSize: pack.credits });
      if (data?.url) window.location.href = data.url;
      else toast({ title: 'Erreur', description: 'URL de paiement non disponible', variant: 'destructive' });
    } catch (error: unknown) {
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Erreur lors de la création de la session de paiement', variant: 'destructive' });
    }
  }, [selectedPack, creditPacks, toast]);

  const handleEnableAutoRefill = useCallback(() => {
    if (!autoRefillPack) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un pack', variant: 'destructive' });
      return;
    }
    setAutoRefillEnabled(true);
    setShowAutoRefillModal(false);
    toast({ title: 'Succès', description: 'Recharge automatique activée' });
  }, [autoRefillPack, toast]);

  useEffect(() => {
    setLoading(false);
  }, []);

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
