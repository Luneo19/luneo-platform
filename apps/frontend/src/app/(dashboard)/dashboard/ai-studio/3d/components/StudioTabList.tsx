'use client';

import { useI18n } from '@/i18n/useI18n';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export function StudioTabList() {
  const { t } = useI18n();
  return (
    <TabsList className="bg-gray-50 border border-gray-200">
      <TabsTrigger value="generate" className="data-[state=active]:bg-cyan-600">
        {t('aiStudio.generate')}
      </TabsTrigger>
      <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600">
        {t('aiStudio.history')}
      </TabsTrigger>
      <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600">
        {t('aiStudio.tabs.templates')}
      </TabsTrigger>
    </TabsList>
  );
}
