'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Crown, Users, Database, Zap, BarChart3, MessageSquare } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface PlanLimits {
  designsPerMonth: number;
  teamMembers: number;
  storageGB: number;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customExport: boolean;
  whiteLabel: boolean;
}

interface Usage {
  designs: {
    canCreate: boolean;
    remaining: number;
  };
  team: {
    canInvite: boolean;
    remaining: number;
  };
}

interface PlanInfo {
  plan: string;
  limits: PlanLimits;
  usage: Usage;
  info: {
    name: string;
    price: number;
    description: string;
  };
}

function PlanLimitsContent() {
  const [planData, setPlanData] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlanData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/plans/current`, {
        credentials: 'include', // Send httpOnly cookies automatically
      });

      if (response.ok) {
        const data = await response.json();
        setPlanData(data);
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération des données du plan', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  const getUsagePercentage = useCallback((used: number, total: number) => {
    if (total === -1) return 0; // Illimité
    return Math.min(100, (used / total) * 100);
  }, []);

  const getPlanColor = useCallback((planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'bg-gray-500';
      case 'pro':
      case 'starter':
      case 'professional':
        return 'bg-blue-500';
      case 'business': return 'bg-green-500';
      case 'enterprise': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!planData) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Impossible de charger les informations du plan.</p>
      </Card>
    );
  }

  const { plan, limits, usage, info } = planData;

  return (
    <div className="space-y-6">
      {/* En-tête du plan */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full ${getPlanColor(plan)} flex items-center justify-center`}>
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{info.name}</h3>
              <p className="text-sm text-gray-600">{info.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            €{info.price}/mois
          </Badge>
        </div>
      </Card>

      {/* Usage des designs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium">Designs ce mois</h4>
          </div>
          <Badge variant={usage.designs.canCreate ? "default" : "destructive"}>
            {usage.designs.remaining === -1 ? 'Illimité' : `${usage.designs.remaining} restants`}
          </Badge>
        </div>
        
        {limits.designsPerMonth !== -1 && (
          <Progress 
            value={getUsagePercentage(limits.designsPerMonth - usage.designs.remaining, limits.designsPerMonth)}
            className="mb-2"
          />
        )}
        
        <p className="text-sm text-gray-600">
          {limits.designsPerMonth === -1 
            ? 'Designs illimités' 
            : `${limits.designsPerMonth - usage.designs.remaining}/${limits.designsPerMonth} utilisés`
          }
        </p>
      </Card>

      {/* Usage de l'équipe */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-green-500" />
            <h4 className="font-medium">Membres d'équipe</h4>
          </div>
          <Badge variant={usage.team.canInvite ? "default" : "destructive"}>
            {usage.team.remaining === -1 ? 'Illimité' : `${usage.team.remaining} places`}
          </Badge>
        </div>
        
        {limits.teamMembers !== -1 && (
          <Progress 
            value={getUsagePercentage(limits.teamMembers - usage.team.remaining, limits.teamMembers)}
            className="mb-2"
          />
        )}
        
        <p className="text-sm text-gray-600">
          {limits.teamMembers === -1 
            ? 'Membres illimités' 
            : `${limits.teamMembers - usage.team.remaining}/${limits.teamMembers} membres`
          }
        </p>
      </Card>

      {/* Stockage */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-orange-500" />
            <h4 className="font-medium">Stockage cloud</h4>
          </div>
          <Badge variant="outline">
            {limits.storageGB === -1 ? 'Illimité' : `${limits.storageGB}GB`}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600">
          {limits.storageGB === -1 
            ? 'Stockage illimité disponible' 
            : `Stockage de ${limits.storageGB}GB inclus`
          }
        </p>
      </Card>

      {/* Fonctionnalités disponibles */}
      <Card className="p-6">
        <h4 className="font-medium mb-4">Fonctionnalités disponibles</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className={`flex items-center space-x-2 p-2 rounded ${limits.apiAccess ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            <Zap className="w-4 h-4" />
            <span className="text-sm">API Access</span>
          </div>
          <div className={`flex items-center space-x-2 p-2 rounded ${limits.advancedAnalytics ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Analytics</span>
          </div>
          <div className={`flex items-center space-x-2 p-2 rounded ${limits.prioritySupport ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Support prioritaire</span>
          </div>
          <div className={`flex items-center space-x-2 p-2 rounded ${limits.whiteLabel ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            <Crown className="w-4 h-4" />
            <span className="text-sm">White Label</span>
          </div>
        </div>
      </Card>

      {/* Bouton d'upgrade */}
      {plan !== 'enterprise' && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="text-center">
            <h4 className="font-medium mb-2">Besoin de plus ?</h4>
            <p className="text-sm text-gray-600 mb-4">
              Upgradez votre plan pour débloquer plus de fonctionnalités
            </p>
            <Button 
              onClick={() => window.open('/pricing', '_blank')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Voir les plans
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

const PlanLimitsContentMemo = memo(PlanLimitsContent);

export function PlanLimits() {
  return (
    <ErrorBoundary componentName="PlanLimits">
      <PlanLimitsContentMemo />
    </ErrorBoundary>
  );
}
