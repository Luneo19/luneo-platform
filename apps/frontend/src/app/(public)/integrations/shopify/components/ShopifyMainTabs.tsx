'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Settings, Code, AlertCircle, HelpCircle } from 'lucide-react';
import { ShopifyOverviewTab } from './ShopifyOverviewTab';
import { ShopifySetupTab } from './ShopifySetupTab';
import { ShopifyCodeTab } from './ShopifyCodeTab';
import { ShopifyTroubleshootingTab } from './ShopifyTroubleshootingTab';
import { ShopifyFAQ } from './ShopifyFAQ';

type TabValue = 'overview' | 'setup' | 'code' | 'troubleshooting' | 'faq';

export function ShopifyMainTabs() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  const handleTestConnection = useCallback(async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult(null);
    try {
      const data = await api.get<{ success?: boolean; message?: string }>('/api/v1/integrations/shopify/test');
      setTestConnectionResult({
        success: data?.success === true,
        message: (data as { message?: string })?.message ?? (data?.success ? 'Connexion Shopify réussie ! Votre boutique est connectée.' : 'Connexion échouée.'),
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setTestConnectionResult({
        success: false,
        message: err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la connexion. Vérifiez vos credentials.',
      });
    } finally {
      setTestConnectionLoading(false);
    }
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d&apos;ensemble</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Installation
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Dépannage</span>
              <span className="sm:hidden">Help</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <ShopifyOverviewTab
              testConnectionLoading={testConnectionLoading}
              testConnectionResult={testConnectionResult}
              onTestConnection={handleTestConnection}
            />
          </TabsContent>
          <TabsContent value="setup" className="space-y-6">
            <ShopifySetupTab />
          </TabsContent>
          <TabsContent value="code" className="space-y-6">
            <ShopifyCodeTab copiedCode={copiedCode} onCopyCode={handleCopyCode} />
          </TabsContent>
          <TabsContent value="troubleshooting" className="space-y-6">
            <ShopifyTroubleshootingTab />
          </TabsContent>
          <TabsContent value="faq" className="space-y-6">
            <ShopifyFAQ />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
