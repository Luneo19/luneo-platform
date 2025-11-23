import { useState, useEffect, useCallback } from 'react';
import { useDemoMode } from '@/hooks/useDemoMode';
import { logger } from '@/lib/logger';
import { Palette, Eye, Download, DollarSign } from 'lucide-react';

interface DashboardStats {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  status?: string;
  image?: string;
}

interface TopDesign {
  id: string;
  title: string;
  image: string;
  views: number;
  likes: number;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats[];
  recentActivity: RecentActivity[];
  topDesigns: TopDesign[];
  period: string;
}

interface ApiResponse {
  data: {
    overview: {
      designs: number;
      orders: number;
      products: number;
      collections: number;
    };
    period: {
      designs: number;
      orders: number;
      revenue: number;
      period: string;
    };
    recent: {
      designs: Array<{
        id: string;
        prompt?: string;
        preview_url?: string;
        created_at: string;
        status?: string;
      }>;
      orders: Array<{
        id: string;
        status: string;
        total_amount: number;
        created_at: string;
      }>;
    };
  };
}

export function useDashboardData(period: '24h' | '7d' | '30d' | '90d' = '7d') {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDemoMode } = useDemoMode();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = isDemoMode
        ? `/api/demo/dashboard?period=${period}`
        : `/api/dashboard/stats?period=${period}`;

      const response = await fetch(endpoint);
      const result = await response.json() as ApiResponse;

      if (!response.ok) {
        throw new Error(result.data?.toString() || 'Erreur lors du chargement des données');
      }

      // Transformer les données de l'API en format attendu par le composant
      const apiData = result.data;
      
      // Calculer les changements (comparaison avec période précédente)
      // Pour simplifier, on utilise des valeurs par défaut si pas de données précédentes
      const previousPeriod = period === '7d' ? '24h' : period === '30d' ? '7d' : '30d';
      
      // Stats transformées
      const stats: DashboardStats[] = [
        {
          title: 'Designs créés',
          value: apiData.overview.designs.toLocaleString('fr-FR'),
          change: `+${apiData.period.designs}`,
          changeType: 'positive',
          icon: 'Palette',
        },
        {
          title: 'Vues totales',
          value: '0', // À calculer depuis usage_tracking si disponible
          change: '+0%',
          changeType: 'positive',
          icon: 'Eye',
        },
        {
          title: 'Téléchargements',
          value: '0', // À calculer depuis usage_tracking si disponible
          change: '+0%',
          changeType: 'positive',
          icon: 'Download',
        },
        {
          title: 'Revenus',
          value: `€${apiData.period.revenue.toFixed(2)}`,
          change: `+${apiData.period.orders} commandes`,
          changeType: apiData.period.revenue > 0 ? 'positive' : 'negative',
          icon: 'DollarSign',
        },
      ];

      // Activité récente (combiner designs et orders)
      const recentActivity: RecentActivity[] = [
        ...apiData.recent.designs.slice(0, 3).map((design) => ({
          id: design.id,
          type: 'design',
          title: design.prompt || 'Design créé',
          description: `Design ${design.status || 'créé'}`,
          time: design.created_at,
          status: design.status,
          image: design.preview_url,
        })),
        ...apiData.recent.orders.slice(0, 2).map((order) => ({
          id: order.id,
          type: 'order',
          title: `Commande ${order.status}`,
          description: `Montant: €${order.total_amount.toFixed(2)}`,
          time: order.created_at,
          status: order.status,
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

      // Top designs (utiliser les designs récents)
      const topDesigns: TopDesign[] = apiData.recent.designs.slice(0, 5).map((design) => ({
        id: design.id,
        title: design.prompt || 'Design sans titre',
        image: design.preview_url || '/placeholder-design.jpg',
        views: 0, // À récupérer depuis usage_tracking si disponible
        likes: 0, // À récupérer depuis usage_tracking si disponible
        created_at: design.created_at,
      }));

      setData({
        stats,
        recentActivity,
        topDesigns,
        period,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement dashboard', {
        error: err,
        period,
        isDemoMode,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period, isDemoMode]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    stats: data?.stats || [],
    recentActivity: data?.recentActivity || [],
    topDesigns: data?.topDesigns || [],
    loading,
    error,
    refresh: loadDashboardData,
  };
}

