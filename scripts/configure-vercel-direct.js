#!/usr/bin/env node

/**
 * Script pour configurer automatiquement toutes les variables d'environnement sur Vercel
 * Utilise Vercel CLI avec une approche interactive
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const ENV_FILE = path.join(__dirname, '..', 'apps', 'frontend', '.env.local');

// Lire les variables depuis .env.local
function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    log('⚠️  Fichier .env.local non trouvé', 'yellow');
    return {};
  }

  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const vars = {};

  content.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z_]+)=["']?([^"'\n]+)["']?$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  });

  return vars;
}

// Configurer une variable sur Vercel avec interaction
function setVercelEnv(key, value) {
  return new Promise((resolve, reject) => {
    log(`📤 Configuration de ${key}...`, 'blue');
    
    // Utiliser spawn pour interagir avec Vercel CLI
    const vercel = spawn('vercel', ['env', 'add', key, 'production', 'preview', 'development'], {
      cwd: path.join(__dirname, '..', 'apps', 'frontend'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    vercel.stdout.on('data', (data) => {
      output += data.toString();
    });

    vercel.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    vercel.on('close', (code) => {
      if (code === 0 || output.includes('Added') || output.includes('Updated')) {
        log(`   ✅ ${key} configuré`, 'green');
        resolve(true);
      } else {
        // Vérifier si c'est parce que la variable existe déjà
        if (errorOutput.includes('already exists') || errorOutput.includes('already')) {
          log(`   ⚠️  ${key} existe déjà, on passe à la suivante`, 'yellow');
          resolve(true); // On considère que c'est OK
        } else {
          log(`   ❌ Erreur: ${errorOutput.substring(0, 100)}`, 'red');
          reject(new Error(errorOutput));
        }
      }
    });

    // Envoyer la valeur
    vercel.stdin.write(value + '\n');
    vercel.stdin.end();
  });
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CONFIGURATION AUTOMATIQUE VERCEL                          ║', 'cyan');
  log('║  Toutes les variables d\'environnement                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Vérifier que Vercel CLI est connecté
  try {
    const whoami = execSync('vercel whoami', { encoding: 'utf-8' }).trim();
    log(`✅ Connecté à Vercel en tant que: ${whoami}`, 'green');
  } catch (error) {
    log('❌ Non connecté à Vercel. Exécutez: vercel login', 'red');
    process.exit(1);
  }

  log('');

  // Lire les variables depuis .env.local
  log('📄 Lecture des variables depuis .env.local...', 'blue');
  const envVars = readEnvFile();

  // Liste des variables à configurer
  const serviceVars = [
    // Redis
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    // QStash
    'QSTASH_URL',
    'QSTASH_TOKEN',
    'QSTASH_CURRENT_SIGNING_KEY',
    'QSTASH_NEXT_SIGNING_KEY',
    // Sentry
    'NEXT_PUBLIC_SENTRY_DSN',
    // Cloudinary
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    // SendGrid
    'SENDGRID_API_KEY',
  ].filter((key) => envVars[key]);

  if (serviceVars.length === 0) {
    log('⚠️  Aucune variable de service trouvée dans .env.local', 'yellow');
    process.exit(1);
  }

  log(`✅ ${serviceVars.length} variables trouvées`, 'green');
  log('');

  // Afficher les variables à configurer
  log('📋 Variables à configurer sur Vercel:', 'cyan');
  serviceVars.forEach((key) => {
    const value = envVars[key];
    const displayValue = key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY')
      ? '***' + value.slice(-4)
      : value;
    log(`   - ${key} = ${displayValue}`, 'cyan');
  });
  log('');

  log('🚀 Configuration des variables sur Vercel...', 'blue');
  log('⚠️  Note: Vercel CLI peut demander confirmation pour chaque variable', 'yellow');
  log('');

  // Configurer chaque variable
  const results = { success: 0, failed: 0 };
  const failedVars = [];

  for (let i = 0; i < serviceVars.length; i++) {
    const key = serviceVars[i];
    const value = envVars[key];
    
    try {
      await setVercelEnv(key, value);
      results.success++;
    } catch (error) {
      log(`   ❌ Échec pour ${key}`, 'red');
      results.failed++;
      failedVars.push(key);
    }
    
    // Petite pause entre les variables
    if (i < serviceVars.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  log(`✅ Succès: ${results.success}`, 'green');
  
  if (results.failed > 0) {
    log(`❌ Échecs: ${results.failed}`, 'red');
    log('');
    log('Variables en échec:', 'yellow');
    failedVars.forEach((key) => {
      log(`   - ${key}`, 'red');
    });
  }

  log('');
  
  if (results.success > 0) {
    log('📋 PROCHAINES ÉTAPES:', 'blue');
    log('1. Vérifier: vercel env ls', 'yellow');
    log('2. Redéployer: vercel --prod', 'yellow');
    log('3. Tester les services en production', 'yellow');
    log('');
  }
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

