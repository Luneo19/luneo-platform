#!/usr/bin/env node

/**
 * Solution finale: Déployer depuis la racine en utilisant le Root Directory correct
 * Le Root Directory doit être VIDE dans Vercel car le repo root est déjà apps/frontend
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
log('║  SOLUTION FINALE - DÉPLOIEMENT FRONTEND                      ║');
log('╚══════════════════════════════════════════════════════════════╝');
log('');

log('🔍 PROBLÈME IDENTIFIÉ:', 'yellow');
log('   - Vercel détecte apps/frontend comme repo root (à cause du .git)', 'yellow');
log('   - Root Directory dans settings = apps/frontend', 'yellow');
log('   - Résultat: Vercel cherche apps/frontend/apps/frontend', 'yellow');
log('');

log('✅ SOLUTION:', 'green');
log('   Le Root Directory dans Vercel doit être VIDE', 'green');
log('   Car Vercel détecte déjà apps/frontend comme repo root', 'green');
log('');

log('📋 ACTION REQUISE:', 'blue');
log('   1. Ouvrir: https://vercel.com/luneos-projects/frontend/settings/build-and-deployment', 'cyan');
log('   2. Section "Root Directory"', 'cyan');
log('   3. EFFACER "apps/frontend" et laisser VIDE', 'cyan');
log('   4. Cliquer "Save"', 'cyan');
log('');

// Ouvrir la page
try {
  execSync('open "https://vercel.com/luneos-projects/frontend/settings/build-and-deployment"', { stdio: 'pipe' });
  log('✅ Page ouverte dans le navigateur', 'green');
} catch (error) {
  // Ignorer
}

log('');
log('⏳ Après avoir vidé le Root Directory, le déploiement fonctionnera', 'yellow');
log('');

log('🚀 Tentative de déploiement (peut échouer si Root Directory pas encore vidé)...', 'blue');
log('');

const repoRoot = path.join(__dirname, '..');
const frontendPath = path.join(repoRoot, 'apps', 'frontend');

// Déployer depuis la racine du repo
const deployProcess = spawn('vercel', ['--prod', '--yes'], {
  cwd: repoRoot,
  env: {
    ...process.env,
    VERCEL_ROOT_DIRECTORY: 'apps/frontend',
  },
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let stdout = '';
let stderr = '';
let deploymentUrl = null;

deployProcess.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  process.stdout.write(output);
  
  const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
  if (urlMatch) {
    deploymentUrl = urlMatch[0];
  }
});

deployProcess.stderr.on('data', (data) => {
  const output = data.toString();
  stderr += output;
  process.stderr.write(colors.red + output + colors.reset);
});

deployProcess.on('close', (code) => {
  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSULTAT                                                   ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  if (code === 0 && deploymentUrl) {
    log(`✅ Frontend déployé avec succès!`, 'green');
    log(`🌐 URL: ${deploymentUrl}`, 'cyan');
  } else {
    log(`❌ Erreur (Code: ${code})`, 'red');
    log('');
    
    if (stdout.includes('root directory') || stdout.includes('path') && stdout.includes('does not exist')) {
      log('💡 SOLUTION:', 'yellow');
      log('   Le Root Directory dans Vercel doit être VIDE', 'yellow');
      log('   Car Vercel détecte déjà apps/frontend comme repo root', 'yellow');
      log('');
      log('   Étapes:', 'blue');
      log('   1. https://vercel.com/luneos-projects/frontend/settings/build-and-deployment', 'cyan');
      log('   2. Section "Root Directory"', 'cyan');
      log('   3. EFFACER "apps/frontend"', 'cyan');
      log('   4. Laisser VIDE', 'cyan');
      log('   5. Sauvegarder', 'cyan');
      log('   6. Redéployer depuis le dashboard ou relancer ce script', 'cyan');
    }
  }
  
  log('');
  process.exit(code);
});

