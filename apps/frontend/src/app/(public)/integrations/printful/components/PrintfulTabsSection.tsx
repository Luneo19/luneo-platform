'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './OverviewTab';
import { SetupTab } from './SetupTab';
import { CodeTab } from './CodeTab';
import { ProductsTab } from './ProductsTab';
import { LocationsTab } from './LocationsTab';
import { TroubleshootingTab } from './TroubleshootingTab';
import { FAQTab } from './FAQTab';
import type { InstallationStep } from './SetupTab';

export type PrintfulTabValue = 'overview' | 'setup' | 'code' | 'products' | 'locations' | 'troubleshooting' | 'faq';

interface PrintfulTabsSectionProps {
  activeTab: PrintfulTabValue;
  setActiveTab: (tab: PrintfulTabValue) => void;
  testConnectionLoading: boolean;
  testConnectionResult: { success: boolean; message: string; details?: { name: string; status: string; message: string }[] } | null;
  onTestConnection: () => void;
  installationSteps: InstallationStep[];
  copiedCode: string | null;
  onCopyCode: (code: string, id: string) => void;
  codeExamples: Record<string, string>;
  productCategories: { name: string; products: string[]; icon: React.ReactNode; color: string }[];
  troubleshootingItems: { question: string; answer: string }[];
  faqItems: { question: string; answer: string }[];
  productionLocations: { country: string; cities: string[]; icon: React.ReactNode; shipping: string }[];
}

export function PrintfulTabsSection({
  activeTab,
  setActiveTab,
  testConnectionLoading,
  testConnectionResult,
  onTestConnection,
  installationSteps,
  copiedCode,
  onCopyCode,
  codeExamples,
  productCategories,
  troubleshootingItems,
  faqItems,
  productionLocations,
}: PrintfulTabsSectionProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PrintfulTabValue)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-8 bg-gray-100 p-2 rounded-xl">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="setup">Installation</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="locations">Centres</TabsTrigger>
            <TabsTrigger value="troubleshooting">Dépannage</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-0">
            <OverviewTab testConnectionLoading={testConnectionLoading} testConnectionResult={testConnectionResult} onTestConnection={onTestConnection} />
          </TabsContent>
          <TabsContent value="setup" className="mt-0">
            <SetupTab installationSteps={installationSteps} copiedCode={copiedCode} onCopyCode={onCopyCode} />
          </TabsContent>
          <TabsContent value="code" className="mt-0">
            <CodeTab codeExamples={codeExamples} copiedCode={copiedCode} onCopyCode={onCopyCode} />
          </TabsContent>
          <TabsContent value="products" className="mt-0">
            <ProductsTab productCategories={productCategories} />
          </TabsContent>
          <TabsContent value="locations" className="mt-0">
            <LocationsTab productionLocations={productionLocations} />
          </TabsContent>
          <TabsContent value="troubleshooting" className="mt-0">
            <TroubleshootingTab items={troubleshootingItems} />
          </TabsContent>
          <TabsContent value="faq" className="mt-0">
            <FAQTab items={faqItems} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
