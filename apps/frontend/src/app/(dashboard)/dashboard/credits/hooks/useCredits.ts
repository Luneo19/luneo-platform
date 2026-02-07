/**
 * Hook principal pour la gestion des crédits
 * Centralise toute la logique métier
 * Utilise les vraies API backend
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import type {
  CreditPack,
  CreditTransaction,
  CreditStats,
  CreditsTab,
} from '../types';

export function useCredits() {
  const { toast } = useToast();

  // State - UI
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

  // State - Data from API
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [balance, setBalance] = useState<number>(0);

  // State - Stats
  const [stats, setStats] = useState<CreditStats>({
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
  });

  // Fetch credit packs from API
  const fetchPacks = useCallback(async () => {
    try {
      const data = await endpoints.credits.packs();
      const raw = data as { packs?: Array<{
        id: string;
        name: string;
        credits: number;
        priceCents?: number;
        price?: number;
        isActive?: boolean;
        isFeatured?: boolean;
        description?: string;
        features?: string[];
        savings?: number;
        badge?: string;
      }> } | Array<{
        id: string;
        name: string;
        credits: number;
        priceCents?: number;
        price?: number;
        isActive?: boolean;
        isFeatured?: boolean;
        description?: string;
        features?: string[];
        savings?: number;
        badge?: string;
      }>;
      const packs = Array.isArray(raw) ? raw : (raw.packs || []);
      const formattedPacks: CreditPack[] = packs.map(p => ({
        id: p.id,
        name: p.name || `Pack ${p.credits}`,
        credits: p.credits,
        priceCents: p.priceCents ?? (p.price != null ? Math.round(p.price * 100) : 0),
        price: p.price ?? (p.priceCents != null ? p.priceCents / 100 : 0),
        isActive: p.isActive ?? true,
        isFeatured: p.isFeatured ?? false,
        description: p.description || '',
        features: p.features || [`${p.credits} crédits`, 'Valable 12 mois'],
        savings: p.savings,
        badge: p.badge,
      }));
      setCreditPacks(formattedPacks);
    } catch (error) {
      logger.error('Failed to fetch credit packs:', error);
      // Fallback to default packs
      setCreditPacks([
        {
          id: 'pack-100',
          name: 'Pack 100',
          credits: 100,
          priceCents: 1900,
          price: 19.0,
          isActive: true,
          isFeatured: false,
          description: 'Idéal pour tester',
          features: ['100 crédits', 'Valable 6 mois', 'Support email'],
        },
        {
          id: 'pack-500',
          name: 'Pack 500',
          credits: 500,
          priceCents: 7900,
          price: 79.0,
          isActive: true,
          isFeatured: true,
          savings: 20,
          badge: 'Meilleur rapport',
          description: 'Le plus populaire',
          features: ['500 crédits', 'Valable 12 mois', 'Support prioritaire', 'Économie de 20%'],
        },
        {
          id: 'pack-1000',
          name: 'Pack 1000',
          credits: 1000,
          priceCents: 13900,
          price: 139.0,
          isActive: true,
          isFeatured: false,
          savings: 30,
          badge: 'Meilleure valeur',
          description: 'Pour les utilisateurs intensifs',
          features: ['1000 crédits', 'Valable 12 mois', 'Support prioritaire', 'Économie de 30%'],
        },
      ]);
    }
  }, []);

  // Fetch balance from API
  const fetchBalance = useCallback(async () => {
    try {
      const data = await endpoints.credits.balance();
      const bal = data?.balance ?? 0;
      setBalance(bal);
      return bal;
    } catch (error) {
      logger.error('Failed to fetch balance:', error);
      return 0;
    }
  }, []);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      const data = await endpoints.credits.transactions({ limit: 100 });
      const raw = data as {
        transactions?: Array<{
          id: string;
          type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment';
          amount: number;
          balanceBefore: number;
          balanceAfter: number;
          source?: string;
          packId?: string;
          packName?: string;
          metadata?: Record<string, unknown>;
          createdAt: string;
        }>;
        total?: number;
      };
      const list = raw.transactions || [];
      const formattedTransactions: CreditTransaction[] = list.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        source: t.source,
        packId: t.packId,
        packName: t.packName,
        metadata: t.metadata as { model?: string; cost?: number },
        createdAt: new Date(t.createdAt),
      }));
      
      setTransactions(formattedTransactions);
      return formattedTransactions;
    } catch (error) {
      logger.error('Failed to fetch transactions:', error);
      setTransactions([]);
      return [];
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPacks(),
          fetchBalance(),
          fetchTransactions(),
        ]);
      } catch (error) {
        logger.error('Failed to load credits data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchPacks, fetchBalance, fetchTransactions]);

  // Update stats when transactions change
  useEffect(() => {
    const currentBalance = balance;
    const totalPurchased = transactions
      .filter(t => t.type === 'purchase')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalUsed = Math.abs(
      transactions
        .filter(t => t.type === 'usage')
        .reduce((acc, t) => acc + t.amount, 0)
    );
    const totalRefunded = transactions
      .filter(t => t.type === 'refund')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalBonus = transactions
      .filter(t => t.type === 'bonus')
      .reduce((acc, t) => acc + t.amount, 0);
    const usageRate =
      totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0;
    const totalGenerations = transactions.filter(
      t => t.type === 'usage'
    ).length;
    const avgCostPerGeneration =
      totalGenerations > 0 ? totalUsed / totalGenerations : 0;
    const byType: Record<string, number> = {};
    const byEndpoint: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    transactions.forEach(t => {
      byType[t.type] = (byType[t.type] || 0) + Math.abs(t.amount);
      if (t.source) {
        byEndpoint[t.source] = (byEndpoint[t.source] || 0) + Math.abs(t.amount);
      }
      if (t.metadata?.model) {
        byModel[t.metadata.model] =
          (byModel[t.metadata.model] || 0) + Math.abs(t.amount);
      }
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
  }, [transactions, balance]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    // Date range filter
    const now = new Date();
    const dateRanges: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    if (filterDateRange !== 'all' && dateRanges[filterDateRange]) {
      const daysAgo = new Date(
        now.getTime() - dateRanges[filterDateRange] * 24 * 60 * 60 * 1000
      );
      filtered = filtered.filter(t => t.createdAt >= daysAgo);
    }
    return filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [transactions, filterType, filterDateRange]);

  // Handlers
  const handlePurchase = useCallback(
    (packId: string) => {
      const pack = creditPacks.find(p => p.id === packId);
      if (!pack) return;
      setSelectedPack(packId);
      setShowPurchaseModal(true);
    },
    [creditPacks]
  );

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedPack) return;
    const pack = creditPacks.find(p => p.id === selectedPack);
    if (!pack) {
      toast({
        title: 'Erreur',
        description: 'Pack introuvable',
        variant: 'destructive',
      });
      return;
    }
    try {
      const data = await endpoints.credits.buy({ packSize: pack.credits });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: 'Erreur',
          description: 'URL de paiement non disponible',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description:
          (error instanceof Error ? error.message : null) ||
          'Erreur lors de la création de la session de paiement',
        variant: 'destructive',
      });
    }
  }, [selectedPack, creditPacks, toast]);

  const handleEnableAutoRefill = useCallback(() => {
    if (!autoRefillPack) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un pack',
        variant: 'destructive',
      });
      return;
    }
    setAutoRefillEnabled(true);
    setShowAutoRefillModal(false);
    toast({ title: 'Succès', description: 'Recharge automatique activée' });
  }, [autoRefillPack, toast]);

  const handleExportCSV = useCallback(() => {
    try {
      const filtered = transactions.filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesType;
      });
      const headers = [
        'ID',
        'Type',
        'Montant',
        'Source',
        'Pack',
        'Date',
      ];
      const rows = filtered.map(t => [
        t.id,
        t.type,
        t.amount > 0 ? `+${t.amount}` : String(t.amount),
        t.source || '',
        t.packName || '',
        new Date(t.createdAt).toLocaleString('fr-FR'),
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(r =>
          r
            .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `credits_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Export CSV',
        description: 'Export CSV réussi !',
      });
      setShowExportModal(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: "Échec de l'export CSV",
        variant: 'destructive',
      });
    }
  }, [transactions, filterType, toast]);

  const handleExportJSON = useCallback(() => {
    try {
      const filtered = transactions.filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesType;
      });
      const jsonContent = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          total: filtered.length,
          transactions: filtered.map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            balanceBefore: t.balanceBefore,
            balanceAfter: t.balanceAfter,
            source: t.source,
            packId: t.packId,
            packName: t.packName,
            createdAt: t.createdAt.toISOString(),
            metadata: t.metadata,
          })),
        },
        null,
        2
      );
      const blob = new Blob([jsonContent], {
        type: 'application/json;charset=utf-8;',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `credits_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Export JSON',
        description: 'Export JSON réussi !',
      });
      setShowExportModal(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: "Échec de l'export JSON",
        variant: 'destructive',
      });
    }
  }, [transactions, filterType, toast]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchBalance(), fetchTransactions()]);
  }, [fetchBalance, fetchTransactions]);

  return {
    // State - UI
    loading,
    selectedPack,
    showPurchaseModal,
    setShowPurchaseModal,
    showAutoRefillModal,
    setShowAutoRefillModal,
    showExportModal,
    setShowExportModal,
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

    // State - Data
    creditPacks,
    transactions,
    stats,
    balance,

    // Computed
    filteredTransactions,

    // Handlers
    handlePurchase,
    handleConfirmPurchase,
    handleEnableAutoRefill,
    handleExportCSV,
    handleExportJSON,
    
    // Refresh
    refreshData,
  };
}
