'use client';

import { AnalyticsDashboardBlock } from './advanced/AnalyticsDashboardBlock';
import { IntegrationHubBlock } from './advanced/IntegrationHubBlock';

/**
 * Renders the advanced dashboard/integration sections that appear below the main tabs.
 * Additional repeated "Part 2" through "Part 11" blocks can be added here or in a separate component
 * to avoid exceeding 300 lines. This file keeps the first two main blocks.
 */
export function AffiliateAdvancedSections() {
  return (
    <>
      <AnalyticsDashboardBlock title="Tableau de Bord Analytique Complet" />
      <IntegrationHubBlock title="Hub d'Intégrations Complet" namePrefix="Intégration " />
    </>
  );
}
