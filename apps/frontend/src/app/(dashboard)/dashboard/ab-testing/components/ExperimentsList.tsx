/**
 * Liste des expériences A/B
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Eye,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import type { Experiment } from '../types';

interface ExperimentsListProps {
  experiments: Experiment[];
  onView: (experiment: Experiment) => void;
  onToggle: (id: string, status: 'running' | 'paused') => void;
}

export function ExperimentsList({
  experiments,
  onView,
  onToggle,
}: ExperimentsListProps) {
  if (experiments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucun test A/B trouvé</p>
      </div>
    );
  }

  const getStatusBadge = (status: Experiment['status']) => {
    const statusConfig = {
      running: { label: 'En cours', className: 'bg-green-500', icon: Play },
      paused: { label: 'En pause', className: 'bg-yellow-500', icon: Pause },
      completed: { label: 'Terminé', className: 'bg-blue-500', icon: CheckCircle2 },
      draft: { label: 'Brouillon', className: 'bg-gray-500', icon: Clock },
      archived: { label: 'Archivé', className: 'bg-gray-600', icon: Clock },
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge className={cn('flex items-center gap-1', config.className)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getConversionRate = (variant: Experiment['variants'][0]) => {
    if (variant.visitors === 0) return 0;
    return (variant.conversions / variant.visitors) * 100;
  };

  const getUplift = (experiment: Experiment) => {
    const control = experiment.variants.find((v) => v.isControl);
    const treatment = experiment.variants.find((v) => !v.isControl);

    if (!control || !treatment || control.visitors === 0) return null;

    const controlRate = control.conversions / control.visitors;
    const treatmentRate = treatment.conversions / treatment.visitors;

    if (controlRate === 0) return null;

    return ((treatmentRate - controlRate) / controlRate) * 100;
  };

  return (
    <div className="space-y-4">
      {experiments.map((experiment) => {
        const control = experiment.variants.find((v) => v.isControl);
        const treatment = experiment.variants.find((v) => !v.isControl);
        const uplift = getUplift(experiment);

        return (
          <Card key={experiment.id} className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-white">{experiment.name}</CardTitle>
                    {getStatusBadge(experiment.status)}
                    {experiment.confidence > 95 && (
                      <Badge className="bg-purple-500">Confiance: {experiment.confidence}%</Badge>
                    )}
                  </div>
                  <CardDescription className="text-gray-400">
                    {experiment.description}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem
                      onClick={() => onView(experiment)}
                      className="text-gray-300 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    {experiment.status === 'running' && (
                      <DropdownMenuItem
                        onClick={() => onToggle(experiment.id, 'paused')}
                        className="text-gray-300 cursor-pointer"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Mettre en pause
                      </DropdownMenuItem>
                    )}
                    {experiment.status === 'paused' && (
                      <DropdownMenuItem
                        onClick={() => onToggle(experiment.id, 'running')}
                        className="text-gray-300 cursor-pointer"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Reprendre
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {control && treatment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">Contrôle</p>
                      <Badge variant="outline" className="border-gray-600">
                        {control.traffic}% trafic
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Visiteurs</span>
                        <span className="text-white">{formatNumber(control.visitors)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Conversions</span>
                        <span className="text-white">{formatNumber(control.conversions)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Taux conversion</span>
                        <span className="text-green-400 font-medium">
                          {getConversionRate(control).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">Variante</p>
                      <Badge variant="outline" className="border-gray-600">
                        {treatment.traffic}% trafic
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Visiteurs</span>
                        <span className="text-white">{formatNumber(treatment.visitors)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Conversions</span>
                        <span className="text-white">{formatNumber(treatment.conversions)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Taux conversion</span>
                        <span className="text-green-400 font-medium">
                          {getConversionRate(treatment).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {uplift !== null && (
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Uplift</span>
                  <div
                    className={cn(
                      'flex items-center gap-2 font-medium',
                      uplift > 0 ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {uplift > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {uplift > 0 ? '+' : ''}
                    {uplift.toFixed(1)}%
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                <span>Démarré: {formatDate(experiment.startDate)}</span>
                {experiment.endDate && <span>Terminé: {formatDate(experiment.endDate)}</span>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}



