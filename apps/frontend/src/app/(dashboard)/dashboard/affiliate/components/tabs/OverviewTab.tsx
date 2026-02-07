'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatPrice, formatRelativeDate } from '@/lib/utils/formatters';
import { CheckCircle, Clock } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import type { AffiliateStats, Commission } from '../types';

interface OverviewTabProps {
  stats: AffiliateStats;
  commissions: Commission[];
}

export function OverviewTab({ stats, commissions }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Performance</CardTitle>
            <CardDescription className="text-gray-400">Statistiques de performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Taux de conversion</span>
                  <span className="text-sm font-medium text-white">{stats.conversionRate.toFixed(1)}%</span>
                </div>
                <Progress value={stats.conversionRate} className="h-2 bg-gray-700" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Click-through rate</span>
                  <span className="text-sm font-medium text-white">{stats.clickThroughRate.toFixed(1)}%</span>
                </div>
                <Progress value={stats.clickThroughRate} className="h-2 bg-gray-700" />
              </div>
              <div className="pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Commission moyenne</p>
                    <p className="text-xl font-bold text-purple-400">{formatPrice(stats.averageCommission)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Meilleur référent</p>
                    <p className="text-xl font-bold text-green-400">
                      {stats.topReferral ? formatPrice(stats.topReferral.revenue) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Commissions</CardTitle>
            <CardDescription className="text-gray-400">Répartition des commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Payées</p>
                    <p className="text-xs text-gray-400">
                      {commissions.filter((c) => c.status === 'paid').length} paiements
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-400">{formatPrice(stats.paidCommissions)}</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">En attente</p>
                    <p className="text-xs text-gray-400">
                      {commissions.filter((c) => c.status === 'pending').length} paiements
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-yellow-400">{formatPrice(stats.pendingCommissions)}</p>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total commissions</span>
                  <span className="text-2xl font-bold text-white">{formatPrice(stats.totalCommissions)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Activité récente</CardTitle>
          <CardDescription className="text-gray-400">Dernières conversions et commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commissions.slice(0, 5).map((commission) => {
              const config = STATUS_CONFIG[commission.status as keyof typeof STATUS_CONFIG];
              const Icon = config?.icon;
              if (!Icon) return null;
              return (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{commission.description}</p>
                      <p className="text-xs text-gray-400">{commission.referralEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">{formatPrice(commission.amount)}</p>
                    <p className="text-xs text-gray-400">{formatRelativeDate(commission.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
