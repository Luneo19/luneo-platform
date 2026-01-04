import 'server-only';

// Feature flags par défaut
const DEFAULT_FLAGS: Record<string, boolean> = {
  enableAIGeneration: true,
  enable3DConfigurator: true,
  enableVirtualTryOn: true,
  enableARExport: true,
  enableBulkGeneration: true,
  enableAdvancedAnalytics: true,
  enableTeamCollaboration: true,
  enableShopifyIntegration: true,
  enableWooCommerceIntegration: true,
  enablePrintfulIntegration: true,
  enableNewPricingPage: true,
  enableReferralProgram: true,
  enableNotificationCenter: true,
  enableSupportTickets: true,
  enableExperimentalFeatures: false,
  enableDebugMode: process.env.NODE_ENV === 'development',
};

/**
 * Charge les feature flags pour le Server Component.
 * 
 * NOTE: Cette fonction retourne directement les flags par défaut sans faire de fetch HTTP.
 * Faire un fetch vers sa propre API route depuis un Server Component peut causer des problèmes
 * sur Vercel (timeout, résolution DNS, etc.). Si vous avez besoin de flags dynamiques,
 * chargez-les depuis une base de données ou des variables d'environnement.
 */
export async function loadFeatureFlags(): Promise<{
  flags: Record<string, boolean>;
  updatedAt: string | null;
}> {
  // Charger depuis les variables d'environnement si disponibles
  const envFlags: Record<string, boolean> = {};
  
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('FEATURE_FLAG_')) {
      const flagName = key
        .replace('FEATURE_FLAG_', '')
        .toLowerCase()
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      envFlags[flagName] = process.env[key] === 'true';
    }
  });
  
  const flags = {
    ...DEFAULT_FLAGS,
    ...envFlags,
  };
  
  return {
    flags,
    updatedAt: new Date().toISOString(),
  };
}

