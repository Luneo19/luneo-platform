'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Link2, Users, DollarSign, Wrench, Settings, Sparkles, Zap, Shield, Globe, Eye, GitBranch } from 'lucide-react';

interface AffiliateTabsListProps {
  linksCount: number;
  referralsCount: number;
  commissionsCount: number;
}

export function AffiliateTabsList({ linksCount, referralsCount, commissionsCount }: AffiliateTabsListProps) {
  return (
    <TabsList className="bg-gray-800/50 border border-gray-700 flex-wrap h-auto gap-1">
      <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">
        <BarChart3 className="w-4 h-4 mr-2" />
        Vue d&apos;ensemble
      </TabsTrigger>
      <TabsTrigger value="links" className="data-[state=active]:bg-cyan-600">
        <Link2 className="w-4 h-4 mr-2" />
        Liens ({linksCount})
      </TabsTrigger>
      <TabsTrigger value="referrals" className="data-[state=active]:bg-cyan-600">
        <Users className="w-4 h-4 mr-2" />
        Parrainages ({referralsCount})
      </TabsTrigger>
      <TabsTrigger value="commissions" className="data-[state=active]:bg-cyan-600">
        <DollarSign className="w-4 h-4 mr-2" />
        Commissions ({commissionsCount})
      </TabsTrigger>
      <TabsTrigger value="tools" className="data-[state=active]:bg-cyan-600">
        <Wrench className="w-4 h-4 mr-2" />
        Outils
      </TabsTrigger>
      <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-600">
        <Settings className="w-4 h-4 mr-2" />
        Paramètres
      </TabsTrigger>
      <TabsTrigger value="ai-ml" className="data-[state=active]:bg-cyan-600">
        <Sparkles className="w-4 h-4 mr-2" />
        IA/ML
      </TabsTrigger>
      <TabsTrigger value="collaboration" className="data-[state=active]:bg-cyan-600">
        Collaboration
      </TabsTrigger>
      <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-600">
        <Zap className="w-4 h-4 mr-2" />
        Performance
      </TabsTrigger>
      <TabsTrigger value="security" className="data-[state=active]:bg-cyan-600">
        <Shield className="w-4 h-4 mr-2" />
        Sécurité
      </TabsTrigger>
      <TabsTrigger value="i18n" className="data-[state=active]:bg-cyan-600">
        <Globe className="w-4 h-4 mr-2" />
        i18n
      </TabsTrigger>
      <TabsTrigger value="accessibility" className="data-[state=active]:bg-cyan-600">
        <Eye className="w-4 h-4 mr-2" />
        Accessibilité
      </TabsTrigger>
      <TabsTrigger value="workflow" className="data-[state=active]:bg-cyan-600">
        <GitBranch className="w-4 h-4 mr-2" />
        Workflow
      </TabsTrigger>
    </TabsList>
  );
}
