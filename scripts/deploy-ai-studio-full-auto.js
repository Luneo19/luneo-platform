#!/usr/bin/env node

/**
 * Script de déploiement AI Studio - Mode 100% Automatique
 * Exécute la migration SQL et configure Vercel automatiquement
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/frontend/.env.local') });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function error(msg) {
  log(`❌ ${msg}`, 'red');
  process.exit(1);
}

function success(msg) {
  log(`✅ ${msg}`, 'green');
}

function info(msg) {
  log(`📋 ${msg}`, 'blue');
}

function warn(msg) {
  log(`⚠️  ${msg}`, 'yellow');
}

// Vérifier variables requises
const requiredVars = [
  'OPENAI_API_KEY',
  'REPLICATE_API_TOKEN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  error(`Variables manquantes: ${missing.join(', ')}\nCréez apps/frontend/.env.local avec ces variables`);
}

const SUPABASE_PROJECT_ID = 'obrijgptqztacolemsbk';
const MIGRATION_FILE = path.join(__dirname, '../apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql');

log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
log('║     DÉPLOIEMENT AI STUDIO - MODE 100% AUTOMATIQUE          ║', 'cyan');
log('╚══════════════════════════════════════════════════════════════╝\n', 'cyan');

// ═══════════════════════════════════════════════════════════════
// 1. EXÉCUTION MIGRATION SQL
// ═══════════════════════════════════════════════════════════════
info('🗄️  Exécution de la migration SQL...\n');

const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf8');

// Méthode 1: Via psql si DATABASE_URL disponible
if (process.env.DATABASE_URL) {
  try {
    info('   Tentative via psql...');
    execSync(`psql "${process.env.DATABASE_URL}" -f "${MIGRATION_FILE}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    success('Migration exécutée via psql');
  } catch (err) {
    warn('psql échoué, tentative via Prisma...');
    
    // Méthode 2: Via Prisma
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Exécuter le SQL
      await prisma.$executeRawUnsafe(migrationSQL);
      await prisma.$disconnect();
      success('Migration exécutée via Prisma');
    } catch (prismaErr) {
      warn('Prisma échoué, migration manuelle requise');
      info('\n📋 Pour exécuter la migration manuellement:');
      log(`   1. Ouvrez: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`, 'blue');
      log(`   2. Copiez le contenu de: ${MIGRATION_FILE}`, 'blue');
      log('   3. Collez et exécutez\n', 'blue');
      
      // Continuer quand même
    }
  }
} else {
  warn('DATABASE_URL non défini, migration manuelle requise');
  info('\n📋 Pour exécuter la migration manuellement:');
  log(`   1. Ouvrez: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`, 'blue');
  log(`   2. Copiez le contenu de: ${MIGRATION_FILE}`, 'blue');
  log('   3. Collez et exécutez\n', 'blue');
}

// ═══════════════════════════════════════════════════════════════
// 2. CONFIGURATION VERCEL
// ═══════════════════════════════════════════════════════════════
info('🚀 Configuration des variables Vercel...\n');

function addVercelEnv(key, value, envs = ['production', 'preview', 'development']) {
  if (!value) {
    warn(`   ${key} vide, ignorée`);
    return;
  }
  
  for (const env of envs) {
    try {
      // Supprimer si existe
      execSync(`echo "${value}" | vercel env rm "${key}" ${env} --yes 2>/dev/null`, { stdio: 'ignore' });
      
      // Ajouter
      execSync(`echo "${value}" | vercel env add "${key}" ${env} --yes`, { stdio: 'ignore' });
      log(`   ✅ ${key} (${env})`, 'green');
    } catch (err) {
      log(`   ❌ ${key} (${env})`, 'red');
    }
  }
}

// Vérifier connexion Vercel
try {
  const vercelUser = execSync('vercel whoami', { encoding: 'utf8' }).trim();
  success(`Connecté à Vercel: ${vercelUser}\n`);
} catch (err) {
  error('Non connecté à Vercel. Exécutez: vercel login');
}

// Variables publiques
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
addVercelEnv('NEXT_PUBLIC_SUPABASE_URL', NEXT_PUBLIC_SUPABASE_URL);
addVercelEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (process.env.SENTRY_DSN) {
  addVercelEnv('NEXT_PUBLIC_SENTRY_DSN', process.env.SENTRY_DSN);
}

// Variables privées
addVercelEnv('OPENAI_API_KEY', process.env.OPENAI_API_KEY, ['production', 'preview']);
addVercelEnv('REPLICATE_API_TOKEN', process.env.REPLICATE_API_TOKEN, ['production', 'preview']);
addVercelEnv('CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME, ['production', 'preview']);
addVercelEnv('CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY, ['production', 'preview']);
addVercelEnv('CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET, ['production', 'preview']);
addVercelEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY, ['production', 'preview']);

if (process.env.UPSTASH_REDIS_REST_URL) {
  addVercelEnv('UPSTASH_REDIS_REST_URL', process.env.UPSTASH_REDIS_REST_URL, ['production', 'preview']);
  addVercelEnv('UPSTASH_REDIS_REST_TOKEN', process.env.UPSTASH_REDIS_REST_TOKEN, ['production', 'preview']);
}

if (process.env.SENTRY_DSN) {
  addVercelEnv('SENTRY_DSN', process.env.SENTRY_DSN, ['production', 'preview']);
}

success('Variables Vercel configurées\n');

// ═══════════════════════════════════════════════════════════════
// 3. BUILD
// ═══════════════════════════════════════════════════════════════
info('🔨 Build...\n');

const frontendDir = path.join(__dirname, '../apps/frontend');

try {
  info('   Installation des dépendances...');
  execSync('pnpm install --no-frozen-lockfile', { 
    cwd: frontendDir, 
    stdio: 'inherit' 
  });
  
  info('   Build en cours...');
  execSync('pnpm run build', { 
    cwd: frontendDir, 
    stdio: 'inherit' 
  });
  
  success('Build réussi\n');
} catch (err) {
  error('Build échoué');
}

// ═══════════════════════════════════════════════════════════════
// 4. DÉPLOIEMENT
// ═══════════════════════════════════════════════════════════════
info('🚀 Déploiement Vercel Production...\n');

try {
  execSync('vercel --prod --yes', { 
    cwd: frontendDir, 
    stdio: 'inherit' 
  });
  
  log('\n╔══════════════════════════════════════════════════════════════╗', 'green');
  log('║           ✅ DÉPLOIEMENT RÉUSSI ! 🎉                        ║', 'green');
  log('╚══════════════════════════════════════════════════════════════╝\n', 'green');
  
  info('🧪 Testez: https://luneo.app/dashboard/ai-studio\n');
} catch (err) {
  error('Déploiement échoué');
}











