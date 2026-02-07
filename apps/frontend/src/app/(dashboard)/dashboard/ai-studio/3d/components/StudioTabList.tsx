'use client';

import {
  Eye,
  Globe,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export function StudioTabList() {
  return (
    <TabsList className="bg-slate-900/50 border border-slate-700">
      <TabsTrigger value="generate" className="data-[state=active]:bg-cyan-600">
        Générer
      </TabsTrigger>
      <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600">
        Historique
      </TabsTrigger>
      <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600">
        Templates
      </TabsTrigger>
      <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">
        Analytics
      </TabsTrigger>
      <TabsTrigger value="ai-ml" className="data-[state=active]:bg-cyan-600">
        <Sparkles className="w-4 h-4 mr-2" />
        IA/ML
      </TabsTrigger>
      <TabsTrigger value="collaboration" className="data-[state=active]:bg-cyan-600">
        <Users className="w-4 h-4 mr-2" />
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
        <Zap className="w-4 h-4 mr-2" />
        Workflow
      </TabsTrigger>
    </TabsList>
  );
}
