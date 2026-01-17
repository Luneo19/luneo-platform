/**
 * Script pour vérifier toutes les variables Stripe nécessaires
 * et préparer les fichiers de configuration pour Vercel et Railway
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const REQUIRED_STRIPE_VARS = {
  // Clés Stripe
  STRIPE_SECRET_KEY: 'sk_live_...',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_...',
  STRIPE_WEBHOOK_SECRET: 'whsec_...',
  
  // Plans
  STRIPE_PRODUCT_PROFESSIONAL: 'prod_...',
  STRIPE_PRICE_PROFESSIONAL_MONTHLY: 'price_...',
  STRIPE_PRICE_PROFESSIONAL_YEARLY: 'price_...',
  STRIPE_PRODUCT_BUSINESS: 'prod_...',
  STRIPE_PRICE_BUSINESS_MONTHLY: 'price_...',
  STRIPE_PRICE_BUSINESS_YEARLY: 'price_...',
  
  // Add-ons
  STRIPE_ADDON_EXTRA_DESIGNS_PRODUCT_ID: 'prod_...',
  STRIPE_ADDON_EXTRA_DESIGNS_MONTHLY: 'price_...',
  STRIPE_ADDON_EXTRA_DESIGNS_YEARLY: 'price_...',
  STRIPE_ADDON_EXTRA_STORAGE_PRODUCT_ID: 'prod_...',
  STRIPE_ADDON_EXTRA_STORAGE_MONTHLY: 'price_...',
  STRIPE_ADDON_EXTRA_STORAGE_YEARLY: 'price_...',
  STRIPE_ADDON_EXTRA_TEAM_MEMBERS_PRODUCT_ID: 'prod_...',
  STRIPE_ADDON_EXTRA_TEAM_MEMBERS_MONTHLY: 'price_...',
  STRIPE_ADDON_EXTRA_TEAM_MEMBERS_YEARLY: 'price_...',
  STRIPE_ADDON_EXTRA_API_CALLS_PRODUCT_ID: 'prod_...',
  STRIPE_ADDON_EXTRA_API_CALLS_MONTHLY: 'price_...',
  STRIPE_ADDON_EXTRA_API_CALLS_YEARLY: 'price_...',
  STRIPE_ADDON_EXTRA_RENDERS_3D_PRODUCT_ID: 'prod_...',
  STRIPE_ADDON_EXTRA_RENDERS_3D_MONTHLY: 'price_...',
  STRIPE_ADDON_EXTRA_RENDERS_3D_YEARLY: 'price_...',
};

const OTHER_REQUIRED_VARS = {
  NEXT_PUBLIC_APP_URL: 'https://app.luneo.app',
  NEXT_PUBLIC_API_URL: 'https://api.luneo.app/api',
};

function loadEnvFile(path: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!existsSync(path)) {
    return env;
  }
  
  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    }
  }
  
  return env;
}

function checkVariables() {
  console.log('🔍 Vérification des variables Stripe...\n');
  
  const envLocal = loadEnvFile(join(process.cwd(), '.env.local'));
  const envProduction = loadEnvFile(join(process.cwd(), '.env.production'));
  
  // Fusionner les deux (env.local a priorité)
  const allEnv = { ...envProduction, ...envLocal };
  
  const missing: string[] = [];
  const present: string[] = [];
  const values: Record<string, string> = {};
  
  // Vérifier les variables Stripe
  for (const [key, _] of Object.entries(REQUIRED_STRIPE_VARS)) {
    const value = allEnv[key];
    if (value && value !== '' && !value.includes('...')) {
      present.push(key);
      values[key] = value;
    } else {
      missing.push(key);
    }
  }
  
  // Afficher le résultat
  console.log('='.repeat(60));
  console.log('📋 Variables Stripe');
  console.log('='.repeat(60));
  
  if (present.length > 0) {
    console.log(`\n✅ Variables présentes (${present.length}):`);
    for (const key of present) {
      const value = values[key];
      const displayValue = key.includes('SECRET') || key.includes('KEY') 
        ? `${value.substring(0, 20)}...` 
        : value;
      console.log(`   ✅ ${key} = ${displayValue}`);
    }
  }
  
  if (missing.length > 0) {
    console.log(`\n❌ Variables manquantes (${missing.length}):`);
    for (const key of missing) {
      console.log(`   ❌ ${key}`);
    }
  }
  
  // Vérifier autres variables importantes
  console.log('\n' + '='.repeat(60));
  console.log('📋 Autres variables importantes');
  console.log('='.repeat(60));
  
  for (const [key, defaultValue] of Object.entries(OTHER_REQUIRED_VARS)) {
    const value = allEnv[key];
    if (value) {
      console.log(`   ✅ ${key} = ${value}`);
    } else {
      console.log(`   ⚠️  ${key} (utilisera: ${defaultValue})`);
    }
  }
  
  // Générer les fichiers de configuration
  if (missing.length === 0) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Toutes les variables Stripe sont configurées !');
    console.log('='.repeat(60));
    
    // Générer fichier Vercel
    generateVercelConfig(values, allEnv);
    
    // Générer fichier Railway
    generateRailwayConfig(values, allEnv);
    
    console.log('\n✅ Fichiers de configuration générés :');
    console.log('   - vercel-production-vars.txt');
    console.log('   - railway-production-vars.txt');
    console.log('\n🚀 Prêt pour le déploiement !');
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  Variables manquantes détectées');
    console.log('='.repeat(60));
    console.log('\nVeuillez configurer les variables manquantes avant de déployer.');
    process.exit(1);
  }
}

function generateVercelConfig(stripeVars: Record<string, string>, allEnv: Record<string, string>) {
  const lines: string[] = [
    '# ==========================================',
    '# Variables d\'environnement VERCEL (Production)',
    '# ==========================================',
    '# Commandes pour ajouter dans Vercel :',
    '#',
    '# vercel env add STRIPE_SECRET_KEY production',
    '# ...',
    '',
    '# OU via le dashboard :',
    '# Settings > Environment Variables',
    '',
  ];
  
  // Variables Stripe
  lines.push('# --- Stripe Configuration ---');
  for (const [key, value] of Object.entries(stripeVars)) {
    lines.push(`${key}=${value}`);
  }
  
  // Autres variables importantes
  lines.push('\n# --- Autres variables ---');
  for (const [key, defaultValue] of Object.entries(OTHER_REQUIRED_VARS)) {
    const value = allEnv[key] || defaultValue;
    lines.push(`${key}=${value}`);
  }
  
  // URLs
  const appUrl = allEnv.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app';
  const apiUrl = allEnv.NEXT_PUBLIC_API_URL || 'https://api.luneo.app/api';
  lines.push(`NEXT_PUBLIC_STRIPE_SUCCESS_URL=${appUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`);
  lines.push(`NEXT_PUBLIC_STRIPE_CANCEL_URL=${appUrl}/pricing`);
  
  writeFileSync(
    join(process.cwd(), 'vercel-production-vars.txt'),
    lines.join('\n') + '\n'
  );
}

function generateRailwayConfig(stripeVars: Record<string, string>, allEnv: Record<string, string>) {
  const lines: string[] = [
    '# ==========================================',
    '# Variables d\'environnement RAILWAY (Production)',
    '# ==========================================',
    '# Commandes pour ajouter dans Railway :',
    '#',
    '# railway variables set STRIPE_SECRET_KEY="sk_live_..." --service backend',
    '# ...',
    '',
  ];
  
  // Variables Stripe
  lines.push('# --- Stripe Configuration (Backend) ---');
  for (const [key, value] of Object.entries(stripeVars)) {
    if (!key.startsWith('NEXT_PUBLIC_')) {
      lines.push(`# railway variables set ${key}="${value}" --service backend`);
    }
  }
  
  writeFileSync(
    join(process.cwd(), 'railway-production-vars.txt'),
    lines.join('\n') + '\n'
  );
}

checkVariables();
