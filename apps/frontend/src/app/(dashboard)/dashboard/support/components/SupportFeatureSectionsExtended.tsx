'use client';

import {
  Sparkles,
  MessageSquare,
  Users,
  BarChart3,
  Zap,
  Code,
  BookOpen,
  FileText,
  HelpCircle,
  Video,
  Share2,
  Trophy,
  CheckCircle,
  Star,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const REPEATED_TOOLS = [
  { name: 'Chat Temps Réel', description: 'Communication instantanée avec vos clients', icon: MessageSquare, status: 'active' },
  { name: 'IA Assistante', description: 'Réponses automatiques intelligentes', icon: Sparkles, status: 'active' },
  { name: 'Routage Auto', description: 'Distribution intelligente des tickets', icon: Users, status: 'active' },
  { name: 'Analytics Pro', description: 'Analyse approfondie des performances', icon: BarChart3, status: 'active' },
  { name: 'Workflow Auto', description: 'Automatisation complète des processus', icon: Zap, status: 'active' },
  { name: 'API Complète', description: 'Intégration via API REST/GraphQL', icon: Code, status: 'active' },
];

function RepeatedSectionCard({ sectionNumber }: { sectionNumber: number }) {
  return (
    <Card className="bg-gray-50 border-gray-200 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Fonctionnalités Avancées de Support - Section {sectionNumber}
        </CardTitle>
        <CardDescription className="text-gray-600">
          Fonctionnalités professionnelles pour un support client de niveau entreprise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPEATED_TOOLS.map((tool, idx) => {
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
      </CardContent>
    </Card>
  );
}

export function SupportFeatureSectionsExtended() {
  return (
    <>
      <Card className="bg-gradient-to-br from-white via-cyan-50/20 to-white border-cyan-500/50 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-400" />
            Résumé Final - Support Client
          </CardTitle>
          <CardDescription className="text-gray-600">
            Plateforme complète de support client avec fonctionnalités de niveau entreprise mondiale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { metric: 'Tickets résolus', value: '1,089', icon: CheckCircle },
                { metric: 'Agents actifs', value: '12', icon: Users },
                { metric: 'Satisfaction', value: '4.8/5', icon: Star },
                { metric: 'Taux résolution', value: '95%', icon: Target },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="text-center">
                    <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900 mb-1">{item.value}</p>
                    <p className="text-xs text-gray-600">{item.metric}</p>
                  </div>
                );
              })}
            </div>
            <Separator className="bg-gray-200" />
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Plateforme de support client de niveau mondial</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <RepeatedSectionCard key={n} sectionNumber={n} />
      ))}

      <Card className="bg-gray-50 border-gray-200 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Fonctionnalités de Collaboration
          </CardTitle>
          <CardDescription className="text-gray-600">
            Collaborez efficacement sur les tickets de support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Équipe Support', description: 'Gérer votre équipe de support efficacement', icon: Users, members: 12, active: 8 },
              { name: 'Assignation Auto', description: 'Assigner automatiquement les tickets', icon: Zap, tickets: 45, success: '95%' },
              { name: 'Partage Contexte', description: 'Partager le contexte entre agents', icon: Share2, shares: 234 },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-cyan-400 mt-1" />
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 text-sm mb-1">{feature.name}</h5>
                        <p className="text-xs text-gray-600 mb-2">{feature.description}</p>
                        {'members' in feature && <p className="text-xs text-cyan-400">{feature.members} membres</p>}
                        {'active' in feature && <p className="text-xs text-green-400">{feature.active} actifs</p>}
                        {'tickets' in feature && <p className="text-xs text-cyan-400">{feature.tickets} tickets</p>}
                        {'success' in feature && <p className="text-xs text-green-400">Succès: {feature.success}</p>}
                        {'shares' in feature && <p className="text-xs text-cyan-400">{feature.shares} partages</p>}
                      </div>
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
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Base de Connaissances Avancée
          </CardTitle>
          <CardDescription className="text-gray-600">
            Gérer votre base de connaissances de manière professionnelle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { category: 'Guides', count: 45, icon: FileText, color: 'cyan' },
              { category: 'FAQ', count: 123, icon: HelpCircle, color: 'blue' },
              { category: 'Tutoriels', count: 28, icon: Video, color: 'green' },
              { category: 'Articles', count: 67, icon: BookOpen, color: 'purple' },
            ].map((item, idx) => {
              const Icon = item.icon;
              const colorClasses: Record<string, { bg: string; text: string }> = {
                cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
                blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
                green: { bg: 'bg-green-500/10', text: 'text-green-400' },
                purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
              };
              const colors = colorClasses[item.color] || colorClasses.cyan;
              return (
                <Card key={idx} className={`${colors.bg} border-gray-200`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.category}</p>
                        <p className={`text-xl font-bold ${colors.text}`}>{item.count}</p>
                      </div>
                    </div>
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
