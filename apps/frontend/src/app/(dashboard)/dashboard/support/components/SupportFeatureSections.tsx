'use client';

import {
  Sparkles,
  MessageSquare,
  Users,
  BarChart3,
  Zap,
  Code,
  Gauge,
  TrendingUp,
  Star,
  Activity,
  CheckCircle,
  Clock,
  TicketIcon,
  Award,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

const ADVANCED_TOOLS = [
  { name: 'Chat en Temps Réel', description: 'Communiquer avec vos clients en temps réel', icon: MessageSquare, status: 'active' as const },
  { name: 'Base de Connaissances IA', description: 'Réponses automatiques intelligentes', icon: Sparkles, status: 'active' as const },
  { name: 'Routage Intelligent', description: 'Diriger les tickets vers les bons agents', icon: Users, status: 'active' as const },
  { name: 'Analytics Avancés', description: 'Analyser les performances du support', icon: BarChart3, status: 'active' as const },
  { name: 'Automatisation Workflow', description: 'Automatiser les processus de support', icon: Zap, status: 'active' as const },
  { name: 'API de Support', description: 'Intégrer le support via API REST/GraphQL', icon: Code, status: 'active' as const },
];

const PERFORMANCE_METRICS = [
  { metric: 'Temps de réponse moyen', value: '2.5 min', target: '< 5 min', status: 'good' as const, icon: Gauge },
  { metric: 'Taux de résolution', value: '95%', target: '> 90%', status: 'excellent' as const, icon: TrendingUp },
  { metric: 'Satisfaction client', value: '4.8/5', target: '> 4.5', status: 'excellent' as const, icon: Star },
  { metric: 'Uptime', value: '99.9%', target: '> 99.5%', status: 'excellent' as const, icon: Activity },
];

const SUPPORT_STATS = [
  { label: 'Tickets ouverts', value: '45', icon: TicketIcon, color: 'cyan' as const },
  { label: 'Tickets résolus', value: '234', icon: CheckCircle, color: 'green' as const },
  { label: 'Agents actifs', value: '8', icon: Users, color: 'blue' as const },
  { label: 'Temps moyen', value: '2.5h', icon: Clock, color: 'purple' as const },
];

const QUALITY_STANDARDS = [
  { standard: 'Temps de réponse SLA', value: '< 5 min', icon: Clock, status: 'excellent' },
  { standard: 'Taux de résolution', value: '> 95%', icon: Target, status: 'excellent' },
  { standard: 'Satisfaction client', value: '> 4.5/5', icon: Star, status: 'excellent' },
];

const AUTOMATION_RULES = [
  { name: 'Routage automatique', description: 'Diriger automatiquement les tickets vers les bons agents', trigger: 'Nouveau ticket', actions: 3, enabled: true },
  { name: 'Réponses automatiques', description: 'Envoyer des réponses automatiques selon les catégories', trigger: 'Ticket créé', actions: 2, enabled: true },
  { name: 'Escalade automatique', description: 'Escalader les tickets non résolus après X heures', trigger: 'Ticket en attente', actions: 1, enabled: false },
];

const ANALYTICS_METRICS = [
  { label: 'Tickets résolus', value: '234', change: '+15%', icon: CheckCircle, trend: 'up' as const },
  { label: 'Temps moyen', value: '2.5h', change: '-10%', icon: Clock, trend: 'up' as const },
  { label: 'Satisfaction', value: '4.8/5', change: '+5%', icon: Star, trend: 'up' as const },
  { label: 'Taux de résolution', value: '95%', change: '+3%', icon: Target, trend: 'up' as const },
];

export function SupportFeatureSections() {
  return (
    <>
      <Card className="bg-gray-50 border-gray-200 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Fonctionnalités Avancées de Support - Section Professionnelle
          </CardTitle>
          <CardDescription className="text-gray-600">
            Dernières fonctionnalités avancées pour un support client de niveau entreprise mondiale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Outils de Support Avancés</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADVANCED_TOOLS.map((tool, idx) => {
                  const Icon = tool.icon;
                  return (
                    <Card key={idx} className="bg-white border-gray-200 hover:border-cyan-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <Icon className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-semibold text-gray-900 text-sm">{tool.name}</h5>
                              <Badge className="bg-green-500 text-xs">{tool.status}</Badge>
                            </div>
                            <p className="text-xs text-gray-600">{tool.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Métriques de Performance</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PERFORMANCE_METRICS.map((metric, idx) => {
                  const Icon = metric.icon;
                  const statusColors: Record<string, { bg: string; text: string }> = {
                    good: { bg: 'bg-green-500/10', text: 'text-green-400' },
                    excellent: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
                  };
                  const colors = statusColors[metric.status] || statusColors.good;
                  return (
                    <Card key={idx} className={`${colors.bg} border-gray-200`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                          <p className="text-xs text-gray-600">{metric.metric}</p>
                        </div>
                        <p className={`text-2xl font-bold ${colors.text} mb-1`}>{metric.value}</p>
                        <p className="text-xs text-gray-500">Cible: {metric.target}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Statistiques de Support</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {SUPPORT_STATS.map((stat, idx) => {
                  const Icon = stat.icon;
                  const colorClasses: Record<string, { bg: string; text: string }> = {
                    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
                    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
                    green: { bg: 'bg-green-500/10', text: 'text-green-400' },
                    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
                  };
                  const colors = colorClasses[stat.color] || colorClasses.cyan;
                  return (
                    <Card key={idx} className={`${colors.bg} border-gray-200`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                        <p className={`text-xl font-bold ${colors.text}`}>{stat.value}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 border-gray-200 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Standards de Qualité de Support
          </CardTitle>
          <CardDescription className="text-gray-600">
            Garantir la qualité professionnelle de tous vos services de support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUALITY_STANDARDS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5 text-cyan-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.standard}</p>
                        <p className="text-lg font-bold text-cyan-400">{item.value}</p>
                      </div>
                      <Badge className="bg-green-500">{item.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 border-gray-200 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Automatisation du Workflow de Support
          </CardTitle>
          <CardDescription className="text-gray-600">
            Automatisez vos processus de support client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Règles d&apos;Automatisation</h4>
            <div className="space-y-3">
              {AUTOMATION_RULES.map((rule, idx) => (
                <Card key={idx} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900 text-sm">{rule.name}</h5>
                          <Badge className={rule.enabled ? 'bg-green-500' : 'bg-gray-400'}>
                            {rule.enabled ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{rule.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Déclencheur: {rule.trigger}</span>
                          <span>Actions: {rule.actions}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-gray-200">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 border-gray-200 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Tableau de Bord Analytique
          </CardTitle>
          <CardDescription className="text-gray-600">
            Analysez les performances de votre support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ANALYTICS_METRICS.map((metric, idx) => {
              const Icon = metric.icon;
              const trendColor = metric.trend === 'up' ? 'text-green-400' : 'text-red-400';
              return (
                <Card key={idx} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className={`text-xs font-medium ${trendColor}`}>{metric.change}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                    <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
