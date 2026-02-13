import { useState, useEffect, useCallback } from 'react';
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

// Raw JSON from fetch - may be ApiResponseBuilder shape or direct ApiResponse
interface DashboardJsonResult {
  success?: boolean;
  data?: ApiResponse;
  overview?: ApiResponse['overview'];
  period?: ApiResponse['period'];
  recent?: ApiResponse['recent'];
}

// Format de réponse de l'API /api/dashboard/stats
interface ApiResponse {
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
}

export function useDashboardData(period: '24h' | '7d' | '30d' | '90d' = '7d') {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = `/api/dashboard/stats?period=${period}`;

      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Vérifier le statut HTTP
      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          // ApiResponseBuilder peut retourner { message: "...", error: "..." }
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Si le JSON est invalide, utiliser le message par défaut
        }
        
        // Si erreur 401/403, c'est probablement un problème d'authentification
        if (response.status === 401 || response.status === 403) {
          logger.warn('Authentification requise pour dashboard', {
            status: response.status,
            endpoint,
          });
          // Ne pas throw, retourner des données vides pour permettre l'affichage
          setData({
            stats: [],
            recentActivity: [],
            topDesigns: [],
            period,
          });
          setError('Authentification requise. Veuillez vous reconnecter.');
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      // Parser la réponse JSON
      let result: DashboardJsonResult;
      try {
        result = (await response.json()) as DashboardJsonResult;
      } catch (parseError) {
        logger.error('Erreur parsing JSON dashboard', {
          error: parseError,
          endpoint,
        });
        throw new Error('Réponse invalide du serveur');
      }

      // ApiResponseBuilder.handle() retourne: { success: true, data: {...} }
      // Mais l'API dashboard/stats retourne directement les données via NextResponse.json(result)
      // Donc on doit gérer les deux cas
      let apiData: ApiResponse;
      
      // Vérifier si c'est le format ApiResponseBuilder (avec success et data)
      if (result.success === true && result.data) {
        // Format: { success: true, data: { overview, period, recent } }
        apiData = result.data;
      } else if (result.data && (result.data.overview || result.data.recent)) {
        // Format: { data: { overview, period, recent } } (sans success)
        apiData = result.data;
      } else if (result.overview || result.recent) {
        // Format direct: { overview, period, recent } (retour direct de NextResponse.json)
        apiData = result as unknown as ApiResponse;
      } else {
        // Log pour debug
        logger.error('Format de réponse API inattendu', {
          result: JSON.stringify(result).substring(0, 200),
          endpoint,
          hasSuccess: 'success' in result,
          hasData: 'data' in result,
          hasOverview: 'overview' in result,
          keys: Object.keys(result),
        });
        throw new Error('Format de données inattendu. Vérifiez les logs pour plus de détails.');
      }
      
      // Validation que apiData a bien la structure attendue
      if (!apiData.overview || !apiData.period || !apiData.recent) {
        logger.error('Structure de données incomplète', {
          hasOverview: !!apiData.overview,
          hasPeriod: !!apiData.period,
          hasRecent: !!apiData.recent,
          apiDataKeys: Object.keys(apiData),
        });
        throw new Error('Structure de données incomplète');
      }
      
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
        image: design.preview_url || '/placeholder-design.svg',
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
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

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

