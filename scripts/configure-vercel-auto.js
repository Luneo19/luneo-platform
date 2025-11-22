#!/usr/bin/env node

/**
 * Script pour configurer automatiquement toutes les variables d'environnement sur Vercel
 * Utilise Vercel CLI directement
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    // Support des formats: KEY="value" ou KEY=value
    const match = line.match(/^([A-Z_]+)=["']?([^"']+)["']?$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  });

  return vars;
}

// Configurer une variable sur Vercel
function setVercelEnv(key, value, environments = ['production', 'preview', 'development']) {
  try {
    // Utiliser Vercel CLI pour ajouter la variable
    const envTargets = environments.join(',');
    const command = `vercel env add ${key} ${environments.join(' ')} <<< "${value}"`;
    
    // Alternative: utiliser echo pour passer la valeur
    execSync(`echo "${value}" | vercel env add ${key} ${environments.join(' ')}`, {
      stdio: 'pipe',
      cwd: path.join(__dirname, '..', 'apps', 'frontend'),
    });
    
    return true;
  } catch (error) {
    // Si la variable existe déjà, essayer de la mettre à jour
    if (error.message.includes('already exists') || error.message.includes('409')) {
      try {
        log(`⚠️  ${key} existe déjà, mise à jour...`, 'yellow');
        // Supprimer et recréer
        execSync(`vercel env rm ${key} production preview development --yes`, {
          stdio: 'pipe',
          cwd: path.join(__dirname, '..', 'apps', 'frontend'),
        });
        execSync(`echo "${value}" | vercel env add ${key} ${environments.join(' ')}`, {
          stdio: 'pipe',
          cwd: path.join(__dirname, '..', 'apps', 'frontend'),
        });
        return true;
      } catch (updateError) {
        log(`❌ Erreur lors de la mise à jour de ${key}: ${updateError.message}`, 'red');
        return false;
      }
    }
    log(`❌ Erreur pour ${key}: ${error.message}`, 'red');
    return false;
  }
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

  // Liste des variables à configurer (tous les services)
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
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SENTRY_AUTH_TOKEN',
    // Cloudinary
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    // SendGrid
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
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
    const displayValue = key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY') || key.includes('PASSWORD')
      ? '***' + value.slice(-4)
      : value;
    log(`   - ${key} = ${displayValue}`, 'cyan');
  });
  log('');

  log('🚀 Configuration des variables sur Vercel...', 'blue');
  log('');

  // Configurer chaque variable
  const results = { success: 0, failed: 0 };
  const failedVars = [];

  for (const key of serviceVars) {
    log(`📤 Configuration de ${key}...`, 'blue');
    
    // Déterminer les environnements
    const isPublic = key.startsWith('NEXT_PUBLIC_');
    const environments = isPublic 
      ? ['production', 'preview', 'development']
      : ['production', 'preview', 'development'];

    // Utiliser une méthode plus fiable avec Vercel CLI
    try {
      // Créer un fichier temporaire avec la valeur
      const tempFile = path.join(__dirname, '..', '.temp-env-value.txt');
      fs.writeFileSync(tempFile, envVars[key]);
      
      // Utiliser vercel env add avec le fichier
      execSync(
        `cat ${tempFile} | vercel env add ${key} ${environments.join(' ')}`,
        {
          stdio: 'pipe',
          cwd: path.join(__dirname, '..', 'apps', 'frontend'),
        }
      );
      
      // Nettoyer
      fs.unlinkSync(tempFile);
      
      log(`   ✅ ${key} configuré`, 'green');
      results.success++;
    } catch (error) {
      // Essayer avec une approche alternative
      try {
        // Vérifier si la variable existe déjà
        execSync(`vercel env ls | grep -q "${key}"`, {
          stdio: 'pipe',
          cwd: path.join(__dirname, '..', 'apps', 'frontend'),
        });
        
        // Si elle existe, la supprimer d'abord
        log(`   ⚠️  ${key} existe déjà, mise à jour...`, 'yellow');
        execSync(`vercel env rm ${key} production preview development --yes`, {
          stdio: 'pipe',
          cwd: path.join(__dirname, '..', 'apps', 'frontend'),
        });
        
        // Recréer
        const tempFile = path.join(__dirname, '..', '.temp-env-value.txt');
        fs.writeFileSync(tempFile, envVars[key]);
        execSync(
          `cat ${tempFile} | vercel env add ${key} ${environments.join(' ')}`,
          {
            stdio: 'pipe',
            cwd: path.join(__dirname, '..', 'apps', 'frontend'),
          }
        );
        fs.unlinkSync(tempFile);
        
        log(`   ✅ ${key} mis à jour`, 'green');
        results.success++;
      } catch (retryError) {
        log(`   ❌ Erreur: ${retryError.message}`, 'red');
        results.failed++;
        failedVars.push(key);
      }
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
    log('');
    log('💡 Vous pouvez les configurer manuellement:', 'yellow');
    log('   vercel env add <KEY> production preview development', 'cyan');
  }

  log('');
  
  if (results.success > 0) {
    log('📋 PROCHAINES ÉTAPES:', 'blue');
    log('1. Vérifier les variables: vercel env ls', 'yellow');
    log('2. Redéployer: vercel --prod', 'yellow');
    log('3. Tester les services en production', 'yellow');
    log('');
  }
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

