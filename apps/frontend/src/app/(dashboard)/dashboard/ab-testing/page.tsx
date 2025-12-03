'use client';

/**
 * A/B Testing Dashboard
 * A-011: Système de création et gestion d'expériences A/B
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Trash2,
  Trophy,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Copy,
  MoreHorizontal,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
interface Variant {
  id: string;
  name: string;
  traffic: number;
  conversions: number;
  visitors: number;
  revenue: number;
  isControl: boolean;
  isWinner?: boolean;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  metric: string;
  variants: Variant[];
  startDate: string;
  endDate?: string;
  confidence: number;
  winner?: string;
}

// Mock data
const mockExperiments: Experiment[] = [
  {
    id: 'exp-1',
    name: 'CTA Button Color Test',
    description: 'Tester si un bouton orange convertit mieux que bleu',
    status: 'running',
    metric: 'conversions',
    confidence: 94.2,
    startDate: '2024-11-15',
    variants: [
      { id: 'v1', name: 'Control (Bleu)', traffic: 50, conversions: 234, visitors: 5420, revenue: 8742, isControl: true },
      { id: 'v2', name: 'Orange', traffic: 50, conversions: 287, visitors: 5380, revenue: 10645, isControl: false, isWinner: true },
    ],
  },
  {
    id: 'exp-2',
    name: 'Pricing Page Layout',
    description: 'Comparaison layout horizontal vs vertical pour la page pricing',
    status: 'completed',
    metric: 'revenue',
    confidence: 98.7,
    startDate: '2024-10-01',
    endDate: '2024-11-01',
    winner: 'Horizontal',
    variants: [
      { id: 'v1', name: 'Vertical (Control)', traffic: 50, conversions: 456, visitors: 12000, revenue: 23400, isControl: true },
      { id: 'v2', name: 'Horizontal', traffic: 50, conversions: 543, visitors: 11800, revenue: 28900, isControl: false, isWinner: true },
    ],
  },
  {
    id: 'exp-3',
    name: 'Onboarding Flow',
    description: 'Test onboarding court vs détaillé',
    status: 'draft',
    metric: 'retention',
    confidence: 0,
    startDate: '',
    variants: [
      { id: 'v1', name: 'Court (Control)', traffic: 50, conversions: 0, visitors: 0, revenue: 0, isControl: true },
      { id: 'v2', name: 'Détaillé', traffic: 50, conversions: 0, visitors: 0, revenue: 0, isControl: false },
    ],
  },
];

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-slate-500', icon: Clock },
  running: { label: 'En cours', color: 'bg-green-500', icon: Play },
  paused: { label: 'En pause', color: 'bg-yellow-500', icon: Pause },
  completed: { label: 'Terminé', color: 'bg-blue-500', icon: CheckCircle },
};

export default function ABTestingPage() {
  const [experiments, setExperiments] = useState<Experiment[]>(mockExperiments);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'draft'>('all');

  // Filter experiments
  const filteredExperiments = useMemo(() => {
    if (filter === 'all') return experiments;
    return experiments.filter(exp => exp.status === filter);
  }, [experiments, filter]);

  // Calculate conversion rate
  const getConversionRate = (variant: Variant) => {
    if (variant.visitors === 0) return 0;
    return ((variant.conversions / variant.visitors) * 100).toFixed(2);
  };

  // Get uplift percentage
  const getUplift = (experiment: Experiment) => {
    const control = experiment.variants.find(v => v.isControl);
    const treatment = experiment.variants.find(v => !v.isControl);
    
    if (!control || !treatment || control.visitors === 0) return null;
    
    const controlRate = control.conversions / control.visitors;
    const treatmentRate = treatment.conversions / treatment.visitors;
    
    if (controlRate === 0) return null;
    
    const uplift = ((treatmentRate - controlRate) / controlRate) * 100;
    return uplift.toFixed(1);
  };

  // Toggle experiment status
  const toggleExperiment = (id: string) => {
    setExperiments(prev => prev.map(exp => {
      if (exp.id !== id) return exp;
      return {
        ...exp,
        status: exp.status === 'running' ? 'paused' : exp.status === 'paused' ? 'running' : exp.status,
      };
    }));
  };

  // Stats cards
  const stats = useMemo(() => ({
    running: experiments.filter(e => e.status === 'running').length,
    completed: experiments.filter(e => e.status === 'completed').length,
    avgConfidence: experiments
      .filter(e => e.status === 'running' || e.status === 'completed')
      .reduce((acc, e) => acc + e.confidence, 0) / 
      experiments.filter(e => e.status === 'running' || e.status === 'completed').length || 0,
  }), [experiments]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-purple-400" />
            A/B Testing
          </h1>
          <p className="text-slate-400">Optimisez vos conversions avec des expériences data-driven</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0 bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Expérience
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Créer une Expérience</DialogTitle>
              <DialogDescription className="text-slate-400">
                Configurez votre test A/B pour optimiser vos conversions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom de l'expérience</Label>
                <Input placeholder="Ex: Test couleur CTA" className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Objectif du test..." className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label>Métrique principale</Label>
                <Select defaultValue="conversions">
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversions">Taux de conversion</SelectItem>
                    <SelectItem value="revenue">Revenu par visiteur</SelectItem>
                    <SelectItem value="retention">Rétention</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Variante A (Control)</Label>
                  <Input placeholder="Nom de la variante" className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Variante B</Label>
                  <Input placeholder="Nom de la variante" className="bg-slate-800 border-slate-700" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsCreateDialogOpen(false)}>
                Créer l'expérience
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Tests Actifs</p>
                <p className="text-3xl font-bold text-green-400">{stats.running}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Play className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Tests Terminés</p>
                <p className="text-3xl font-bold text-blue-400">{stats.completed}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Confiance Moyenne</p>
                <p className="text-3xl font-bold text-purple-400">{stats.avgConfidence.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="all">Tous ({experiments.length})</TabsTrigger>
            <TabsTrigger value="running">En cours ({experiments.filter(e => e.status === 'running').length})</TabsTrigger>
            <TabsTrigger value="completed">Terminés ({experiments.filter(e => e.status === 'completed').length})</TabsTrigger>
            <TabsTrigger value="draft">Brouillons ({experiments.filter(e => e.status === 'draft').length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Experiments List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredExperiments.map((experiment, index) => (
            <motion.div
              key={experiment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${statusConfig[experiment.status].color}/20`}>
                        {React.createElement(statusConfig[experiment.status].icon, {
                          className: `w-6 h-6 ${statusConfig[experiment.status].color.replace('bg-', 'text-')}`,
                        })}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{experiment.name}</CardTitle>
                          <Badge variant="outline" className={`${statusConfig[experiment.status].color} text-white border-0`}>
                            {statusConfig[experiment.status].label}
                          </Badge>
                          {experiment.winner && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-0">
                              <Trophy className="w-3 h-3 mr-1" />
                              Winner: {experiment.winner}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">{experiment.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(experiment.status === 'running' || experiment.status === 'paused') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExperiment(experiment.id)}
                          className="border-slate-700"
                        >
                          {experiment.status === 'running' ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Reprendre
                            </>
                          )}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Variants */}
                  <div className="space-y-4">
                    {experiment.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`p-4 rounded-lg ${variant.isWinner ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-800/50'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{variant.name}</span>
                            {variant.isControl && (
                              <Badge variant="outline" className="text-xs border-slate-600">Control</Badge>
                            )}
                            {variant.isWinner && (
                              <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                                <Trophy className="w-3 h-3 mr-1" />
                                Gagnant
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-slate-400">{variant.traffic}% du trafic</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-slate-400">Visiteurs</p>
                            <p className="text-lg font-semibold">{variant.visitors.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Conversions</p>
                            <p className="text-lg font-semibold">{variant.conversions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Taux Conv.</p>
                            <p className="text-lg font-semibold text-blue-400">{getConversionRate(variant)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Revenu</p>
                            <p className="text-lg font-semibold text-green-400">€{variant.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Stats */}
                  {(experiment.status === 'running' || experiment.status === 'completed') && (
                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">Confiance:</span>
                          <span className={`font-semibold ${experiment.confidence >= 95 ? 'text-green-400' : experiment.confidence >= 90 ? 'text-yellow-400' : 'text-slate-400'}`}>
                            {experiment.confidence}%
                          </span>
                        </div>
                        {getUplift(experiment) && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400">Uplift:</span>
                            <span className={`font-semibold ${Number(getUplift(experiment)) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {Number(getUplift(experiment)) > 0 ? '+' : ''}{getUplift(experiment)}%
                            </span>
                          </div>
                        )}
                      </div>
                      {experiment.confidence >= 95 && experiment.status === 'running' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Déclarer gagnant
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredExperiments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FlaskConical className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune expérience</h3>
          <p className="text-slate-400 mb-6">Commencez par créer votre première expérience A/B</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Expérience
          </Button>
        </motion.div>
      )}
    </div>
  );
}


