'use client';

/**
 * Seller Dashboard Page
 * MK-009: Dashboard vendeur pour le marketplace
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  CreditCard,
  Package,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Settings,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SellerStatus {
  hasAccount: boolean;
  accountId?: string;
  status?: 'pending' | 'active';
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
  commissionRate?: number;
}

interface SellerStats {
  totalSales: number;
  totalRevenue: number;
  pendingPayout: number;
  totalTemplates: number;
  averageRating: number;
  thisMonthSales: number;
}

export default function SellerDashboardPage() {
  const { toast } = useToast();
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    fetchSellerStatus();
    fetchSellerStats();
  }, []);

  const fetchSellerStatus = async () => {
    try {
      const response = await fetch('/api/marketplace/seller/connect');
      const data = await response.json();
      setSellerStatus(data.data || data);
    } catch (error) {
      console.error('Failed to fetch seller status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSellerStats = async () => {
    try {
      const response = await fetch('/api/marketplace/seller/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || data);
      }
    } catch (error) {
      console.error('Failed to fetch seller stats:', error);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/marketplace/seller/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: 'FR',
          businessType: 'individual',
        }),
      });

      const data = await response.json();

      if (data.data?.onboardingUrl || data.onboardingUrl) {
        window.location.href = data.data?.onboardingUrl || data.onboardingUrl;
      } else {
        throw new Error('No onboarding URL received');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de créer le compte vendeur",
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccessDashboard = async () => {
    try {
      const response = await fetch('/api/marketplace/seller/dashboard-link', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.data?.url || data.url) {
        window.open(data.data?.url || data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'accéder au tableau de bord Stripe",
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Not yet a seller - show onboarding
  if (!sellerStatus?.hasAccount) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Devenez vendeur sur Luneo
            </h2>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">
              Vendez vos templates sur notre marketplace et gagnez 70% sur chaque vente.
              Créez votre compte vendeur en quelques minutes.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">70%</div>
                <div className="text-sm text-slate-400">Revenus pour vous</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0€</div>
                <div className="text-sm text-slate-400">Frais d'inscription</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">J+7</div>
                <div className="text-sm text-slate-400">Paiement rapide</div>
              </div>
            </div>

            <Button
              onClick={handleConnectStripe}
              disabled={isConnecting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Créer mon compte vendeur
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Seller exists but setup incomplete
  if (!sellerStatus.chargesEnabled || !sellerStatus.payoutsEnabled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-amber-900/20 border-amber-500/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Finalisez votre inscription
                </h3>
                <p className="text-slate-300 mb-4">
                  Votre compte vendeur est créé mais nécessite des informations supplémentaires
                  pour activer les paiements.
                </p>

                {sellerStatus.requirements?.currentlyDue && sellerStatus.requirements.currentlyDue.length > 0 && (
                  <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-2">Informations requises :</p>
                    <ul className="list-disc list-inside text-sm text-slate-300">
                      {sellerStatus.requirements.currentlyDue.slice(0, 5).map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button onClick={handleConnectStripe} className="bg-amber-600 hover:bg-amber-700">
                  Compléter mon profil
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active seller dashboard
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Vendeur</h1>
          <p className="text-slate-400">Gérez vos ventes et templates</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleAccessDashboard}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Stripe Dashboard
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau template
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <Card className="bg-green-900/20 border-green-500/30">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-medium">
            Compte vendeur actif - Paiements activés
          </span>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Revenus total',
            value: `${((stats?.totalRevenue || 0) / 100).toFixed(2)}€`,
            icon: DollarSign,
            color: 'text-green-400',
            bg: 'bg-green-500/20',
          },
          {
            label: 'Ventes ce mois',
            value: stats?.thisMonthSales || 0,
            icon: TrendingUp,
            color: 'text-blue-400',
            bg: 'bg-blue-500/20',
          },
          {
            label: 'En attente de paiement',
            value: `${((stats?.pendingPayout || 0) / 100).toFixed(2)}€`,
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-500/20',
          },
          {
            label: 'Templates publiés',
            value: stats?.totalTemplates || 0,
            icon: Package,
            color: 'text-purple-400',
            bg: 'bg-purple-500/20',
          },
        ].map((stat, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commission Info */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Votre commission</CardTitle>
          <CardDescription>
            Commission de {100 - (sellerStatus.commissionRate || 30)}% sur chaque vente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold text-green-400">
                {100 - (sellerStatus.commissionRate || 30)}%
              </div>
              <div className="text-sm text-slate-400">Pour vous</div>
            </div>
            <div className="h-12 w-px bg-slate-700" />
            <div>
              <div className="text-3xl font-bold text-slate-500">
                {sellerStatus.commissionRate || 30}%
              </div>
              <div className="text-sm text-slate-400">Frais plateforme</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

