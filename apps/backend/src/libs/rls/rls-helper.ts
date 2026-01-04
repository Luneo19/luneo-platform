/**
 * RLS (Row Level Security) Helper
 * 
 * Ce helper permet de configurer RLS PostgreSQL de manière safe.
 * 
 * IMPORTANT: RLS doit être activé progressivement avec feature flag.
 */

export interface RLSPolicy {
  tableName: string;
  policyName: string;
  usingExpression: string;
  withCheckExpression?: string;
}

/**
 * Génère les policies RLS pour toutes les tables tenant-scoped
 */
export function generateRLSPolicies(): RLSPolicy[] {
  return [
    {
      tableName: 'Design',
      policyName: 'design_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
    {
      tableName: 'Order',
      policyName: 'order_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
    {
      tableName: 'Product',
      policyName: 'product_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
    {
      tableName: 'Customization',
      policyName: 'customization_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
    {
      tableName: 'Webhook',
      policyName: 'webhook_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
    {
      tableName: 'ApiKey',
      policyName: 'apikey_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
    {
      tableName: 'AICost',
      policyName: 'aicost_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
    {
      tableName: 'EcommerceIntegration',
      policyName: 'ecommerce_integration_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
    {
      tableName: 'UsageMetric',
      policyName: 'usage_metric_isolation',
      usingExpression: '"brandId" = current_setting(\'app.current_brand_id\', true)::text',
    },
  ];
}

/**
 * Génère le SQL pour activer RLS
 */
export function generateRLSMigrationSQL(): string {
  const policies = generateRLSPolicies();
  const sql: string[] = [];

  // Activer RLS sur toutes les tables
  for (const policy of policies) {
    sql.push(`-- Enable RLS on ${policy.tableName}`);
    sql.push(`ALTER TABLE "${policy.tableName}" ENABLE ROW LEVEL SECURITY;`);
    sql.push('');
  }

  // Créer les policies
  for (const policy of policies) {
    sql.push(`-- Create policy for ${policy.tableName}`);
    sql.push(`CREATE POLICY "${policy.policyName}" ON "${policy.tableName}"`);
    sql.push(`  FOR ALL`);
    sql.push(`  USING (${policy.usingExpression});`);
    sql.push('');
  }

  return sql.join('\n');
}

/**
 * Génère le SQL pour désactiver RLS (rollback)
 */
export function generateRLSRollbackSQL(): string {
  const policies = generateRLSPolicies();
  const sql: string[] = [];

  // Supprimer les policies
  for (const policy of policies) {
    sql.push(`DROP POLICY IF EXISTS "${policy.policyName}" ON "${policy.tableName}";`);
  }

  sql.push('');

  // Désactiver RLS
  for (const policy of policies) {
    sql.push(`ALTER TABLE "${policy.tableName}" DISABLE ROW LEVEL SECURITY;`);
  }

  return sql.join('\n');
}





























