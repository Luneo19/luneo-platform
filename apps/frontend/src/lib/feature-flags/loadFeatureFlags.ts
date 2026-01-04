import 'server-only';

interface FeatureFlagsServerResponse {
  updatedAt?: string;
  flags?: Record<string, boolean>;
}

// Feature flags par défaut (fallback)
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

export async function loadFeatureFlags(): Promise<{
  flags: Record<string, boolean>;
  updatedAt: string | null;
}> {
  // Dans Next.js Server Components, on peut utiliser fetch directement
  // Mais pour éviter les problèmes de résolution DNS/timeout avec les URLs externes,
  // on utilise une approche plus robuste avec timeout et gestion d'erreur
  try {
    // Construire l'URL de manière sécurisée
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const endpoint = `${baseUrl}/api/feature-flags`;

    // Utiliser fetch avec timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout réduit à 3s

    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store', // Pas de cache pour éviter les problèmes
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Retourner les flags par défaut si l'API échoue
      return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
    }

    const data = (await response.json()) as FeatureFlagsServerResponse;
    return {
      flags: data.flags ?? DEFAULT_FLAGS,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  } catch (error) {
    // En cas d'erreur (timeout, réseau, etc.), retourner les flags par défaut
    // Ne pas logger l'erreur pour éviter de polluer les logs en production
    return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
  }
}

