'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Users, Coins, Copy, Check, Share2, TrendingUp,
  Wallet, Award, Twitter, Linkedin, Mail, ExternalLink, Loader2,
  ChevronRight, Clock, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/logger';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingCommissions: number;
  paidCommissions: number;
  currentTier: string;
  commissionRate: number;
  referralCode: string;
}

interface Referral {
  id: string;
  email: string;
  status: 'pending' | 'active' | 'churned';
  plan: string;
  commission: number;
  joined_at: string;
}

const tiers = [
  { min: 0, max: 4, label: 'Bronze', rate: 20, icon: '🥉' },
  { min: 5, max: 14, label: 'Argent', rate: 25, icon: '🥈' },
  { min: 15, max: 29, label: 'Or', rate: 30, icon: '🥇' },
  { min: 30, max: Infinity, label: 'Diamant', rate: 35, icon: '💎' },
];

export default function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/referral/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setReferrals(data.data.referrals || []);
      } else {
        // Données de démo
        setStats({
          totalReferrals: 12,
          activeReferrals: 8,
          pendingCommissions: 156.80,
          paidCommissions: 892.40,
          currentTier: 'Argent',
          commissionRate: 25,
          referralCode: 'LUNEO-USER123',
        });
        setReferrals([
          { id: '1', email: 'john***@email.com', status: 'active', plan: 'Professional', commission: 12.25, joined_at: '2024-01-15' },
          { id: '2', email: 'marie***@email.com', status: 'active', plan: 'Business', commission: 24.75, joined_at: '2024-01-18' },
          { id: '3', email: 'pierre***@email.com', status: 'pending', plan: 'Starter', commission: 0, joined_at: '2024-02-01' },
        ]);
      }
    } catch (error) {
      logger.error('Error loading referral data', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!stats) return;
    navigator.clipboard.writeText(`https://luneo.app/ref/${stats.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    if (!stats || stats.pendingCommissions < 50) return;
    setWithdrawing(true);
    try {
      await fetch('/api/referral/withdraw', { method: 'POST' });
      // Simuler le retrait
      setStats((prev) => prev ? { ...prev, pendingCommissions: 0, paidCommissions: prev.paidCommissions + prev.pendingCommissions } : null);
    } catch (error) {
      logger.error('Error withdrawing', { error });
    } finally {
      setWithdrawing(false);
    }
  };

  const shareLinks = stats ? {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Découvrez Luneo, la plateforme de personnalisation 3D ! Utilisez mon code pour 20% de réduction : ')}&url=${encodeURIComponent(`https://luneo.app/ref/${stats.referralCode}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://luneo.app/ref/${stats.referralCode}`)}`,
    email: `mailto:?subject=${encodeURIComponent('Découvrez Luneo')}&body=${encodeURIComponent(`Salut ! Je te recommande Luneo pour la personnalisation 3D. Utilise mon lien pour 20% de réduction : https://luneo.app/ref/${stats.referralCode}`)}`,
  } : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Programme de parrainage</h2>
        <p className="text-gray-400 mb-6">Rejoignez notre programme et commencez à gagner des commissions</p>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
          Activer le parrainage
        </Button>
      </div>
    );
  }

  const currentTierInfo = tiers.find((t) => t.label === stats.currentTier) || tiers[0];
  const nextTier = tiers.find((t) => t.rate > currentTierInfo.rate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Gift className="w-8 h-8 text-purple-400" />
            Parrainage
          </h1>
          <p className="text-gray-400 mt-1">Gérez votre programme d'affiliation</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentTierInfo.icon}</span>
          <div>
            <p className="text-white font-medium">{currentTierInfo.label}</p>
            <p className="text-sm text-purple-400">{stats.commissionRate}% de commission</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Filleuls</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
          <p className="text-xs text-green-400 mt-1">{stats.activeReferrals} actifs</p>
        </Card>

        <Card className="p-5 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm text-gray-400">Taux</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.commissionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Commission</p>
        </Card>

        <Card className="p-5 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-gray-400">En attente</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pendingCommissions.toFixed(2)}€</p>
          <p className="text-xs text-gray-500 mt-1">À retirer</p>
        </Card>

        <Card className="p-5 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-gray-400">Total gagné</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.paidCommissions.toFixed(2)}€</p>
          <p className="text-xs text-gray-500 mt-1">Versé</p>
        </Card>
      </div>

      {/* Tier Progress */}
      {nextTier && (
        <Card className="p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-medium">Progression vers {nextTier.label}</h3>
              <p className="text-sm text-gray-400">
                Plus que {nextTier.min - stats.activeReferrals} filleul{nextTier.min - stats.activeReferrals > 1 ? 's' : ''} pour débloquer {nextTier.rate}% de commission
              </p>
            </div>
            <span className="text-2xl">{nextTier.icon}</span>
          </div>
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((stats.activeReferrals / nextTier.min) * 100, 100)}%` }}
              className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{stats.activeReferrals} filleuls</span>
            <span>{nextTier.min} filleuls</span>
          </div>
        </Card>
      )}

      {/* Referral Link */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-white font-semibold mb-4">Votre lien de parrainage</h3>
        <div className="flex gap-2 mb-4">
          <Input
            value={`https://luneo.app/ref/${stats.referralCode}`}
            readOnly
            className="flex-1 bg-gray-900 border-gray-600 text-gray-300 font-mono text-sm"
          />
          <Button onClick={handleCopy} variant="outline" className="border-purple-500/50 text-purple-400">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-gray-600">
              <Twitter className="w-4 h-4 mr-2" /> Twitter
            </Button>
          </a>
          <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-gray-600">
              <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
            </Button>
          </a>
          <a href={shareLinks.email}>
            <Button variant="outline" size="sm" className="border-gray-600">
              <Mail className="w-4 h-4 mr-2" /> Email
            </Button>
          </a>
        </div>
      </Card>

      {/* Withdraw */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold mb-1">Retirer vos gains</h3>
            <p className="text-sm text-gray-400">
              Minimum de retrait : 50€ • Paiement par virement bancaire
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white mb-2">{stats.pendingCommissions.toFixed(2)}€</p>
            <Button
              onClick={handleWithdraw}
              disabled={stats.pendingCommissions < 50 || withdrawing}
              className="bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-50"
            >
              {withdrawing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wallet className="w-4 h-4 mr-2" />
              )}
              Retirer
            </Button>
          </div>
        </div>
      </Card>

      {/* Referrals List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Vos filleuls</h3>
        </div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucun filleul pour le moment</p>
            <p className="text-sm text-gray-500 mt-1">Partagez votre lien pour commencer à gagner</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {referrals.map((referral) => (
              <div key={referral.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    referral.status === 'active' ? 'bg-green-400' :
                    referral.status === 'pending' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{referral.email}</p>
                    <p className="text-sm text-gray-500">
                      {referral.plan} • Inscrit le {new Date(referral.joined_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{referral.commission.toFixed(2)}€</p>
                  <p className="text-xs text-gray-500">Commission</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

