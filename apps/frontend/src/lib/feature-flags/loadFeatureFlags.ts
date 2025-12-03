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
  // Utiliser l'API locale Next.js
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  'http://localhost:3000';
  const endpoint = `${baseUrl}/api/feature-flags`;

  try {
    // Créer un AbortController avec timeout de 5 secondes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      next: {
        revalidate: 60, // Cache for 60 seconds
      },
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
  } catch {
    // En cas d'erreur (timeout, réseau, etc.), retourner les flags par défaut
    return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
  }
}

