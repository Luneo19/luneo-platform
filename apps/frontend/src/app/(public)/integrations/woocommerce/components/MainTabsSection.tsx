'use client';

import React from 'react';
import { Globe, Settings, Code, AlertCircle, HelpCircle, DollarSign, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './OverviewTab';
import { SetupTab } from './SetupTab';
import { CodeTab } from './CodeTab';
import { TroubleshootingTab } from './TroubleshootingTab';
import { FAQTab } from './FAQTab';
import { PricingTab } from './PricingTab';
import { ComparisonTab } from './ComparisonTab';
import type { InstallationStep } from './SetupTab';
import type { PricingPlan } from './PricingTab';

export type TabValue = 'overview' | 'setup' | 'code' | 'troubleshooting' | 'faq' | 'pricing' | 'comparison';

interface MainTabsSectionProps {
  activeTab: TabValue;
  setActiveTab: (v: TabValue) => void;
  // Overview
  testConnectionLoading: boolean;
  testConnectionResult: { success: boolean; message: string; details?: { name: string; status: string; message: string }[] } | null;
  onTestConnection: () => void;
  // Setup
  installationSteps: InstallationStep[];
  copiedCode: string | null;
  onCopyCode: (code: string, id: string) => void;
  // Code
  codeExamples: Record<string, string>;
  // Troubleshooting
  troubleshootingItems: { question: string; answer: string }[];
  // FAQ
  faqItems: { question: string; answer: string }[];
  // Pricing
  pricingPlans: PricingPlan[];
  // Comparison
  comparisonFeatures: { feature: string; luneo: string; competitors: string }[];
}

export function MainTabsSection({
  activeTab,
  setActiveTab,
  testConnectionLoading,
  testConnectionResult,
  onTestConnection,
  installationSteps,
  copiedCode,
  onCopyCode,
  codeExamples,
  troubleshootingItems,
  faqItems,
  pricingPlans,
  comparisonFeatures,
}: MainTabsSectionProps) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 mb-12 h-auto p-1 bg-gray-100 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d&apos;ensemble</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Settings className="w-4 h-4" />
              Installation
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Code className="w-4 h-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="troubleshooting" className="flex items-center gap-2 data-[state=active]:bg-white">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Dépannage</span>
              <span className="sm:hidden">Help</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2 data-[state=active]:bg-white">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-white">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Tarifs</span>
              <span className="sm:hidden">Prix</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2 data-[state=active]:bg-white">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Comparaison</span>
              <span className="sm:hidden">Compare</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <OverviewTab
              testConnectionLoading={testConnectionLoading}
              testConnectionResult={testConnectionResult}
              onTestConnection={onTestConnection}
            />
          </TabsContent>
          <TabsContent value="setup" className="space-y-8">
            <SetupTab
              installationSteps={installationSteps}
              copiedCode={copiedCode}
              onCopyCode={onCopyCode}
            />
          </TabsContent>
          <TabsContent value="code" className="space-y-8">
            <CodeTab codeExamples={codeExamples} copiedCode={copiedCode} onCopyCode={onCopyCode} />
          </TabsContent>
          <TabsContent value="troubleshooting" className="space-y-8">
            <TroubleshootingTab items={troubleshootingItems} />
          </TabsContent>
          <TabsContent value="faq" className="space-y-8">
            <FAQTab items={faqItems} />
          </TabsContent>
          <TabsContent value="pricing" className="space-y-8">
            <PricingTab plans={pricingPlans} />
          </TabsContent>
          <TabsContent value="comparison" className="space-y-8">
            <ComparisonTab features={comparisonFeatures} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
