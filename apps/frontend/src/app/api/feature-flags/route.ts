/**
 * API Route: Feature Flags
 * 
 * Retourne les feature flags actifs pour l'application.
 * En production, cela pourrait être connecté à un service comme LaunchDarkly, 
 * Unleash, ou une configuration en base de données.
 */

import { NextResponse } from 'next/server';

// Feature flags par défaut
const DEFAULT_FLAGS: Record<string, boolean> = {
  // Fonctionnalités principales
  enableAIGeneration: true,
  enable3DConfigurator: true,
  enableVirtualTryOn: true,
  enableARExport: true,
  
  // Fonctionnalités en beta
  enableBulkGeneration: true,
  enableAdvancedAnalytics: true,
  enableTeamCollaboration: true,
  
  // Intégrations
  enableShopifyIntegration: true,
  enableWooCommerceIntegration: true,
  enablePrintfulIntegration: true,
  
  // Nouvelles fonctionnalités
  enableNewPricingPage: true,
  enableReferralProgram: true,
  enableNotificationCenter: true,
  enableSupportTickets: true,
  
  // Fonctionnalités expérimentales (désactivées par défaut)
  enableExperimentalFeatures: false,
  enableDebugMode: process.env.NODE_ENV === 'development',
};

export async function GET() {
  // En production, vous pourriez récupérer les flags depuis:
  // - Une base de données (PostgreSQL via backend)
  // - Un service externe (LaunchDarkly, Unleash)
  // - Des variables d'environnement
  
  // Fusionner avec les flags d'environnement si disponibles
  const envFlags: Record<string, boolean> = {};
  
  // Exemple: FEATURE_FLAG_ENABLE_AI_GENERATION=true
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
  
  return NextResponse.json({
    success: true,
    flags,
    updatedAt: new Date().toISOString(),
    source: 'local',
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

// Permettre la modification des flags (admin seulement en prod)
export async function POST(request: Request) {
  // En production, vérifier l'authentification admin
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not allowed in production' },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    const { flags } = body;
    
    // En dev, vous pourriez sauvegarder dans un fichier local ou en mémoire
    // Pour l'instant, on retourne juste les flags reçus
    
    return NextResponse.json({
      success: true,
      flags: { ...DEFAULT_FLAGS, ...flags },
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}


