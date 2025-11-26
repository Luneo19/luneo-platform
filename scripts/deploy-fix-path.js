#!/usr/bin/env node

/**
 * Script pour déployer en corrigeant le problème de chemin
 * Le Root Directory doit être VIDE car Vercel détecte déjà apps/frontend comme root
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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
log('║  SOLUTION AU PROBLÈME DE ROOT DIRECTORY                     ║', 'cyan');
log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
log('');

log('🔍 DIAGNOSTIC:', 'blue');
log('');

// Vérifier où est le repo Git
const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
log(`📁 Repo Git root: ${repoRoot}`, 'cyan');

const frontendPath = path.join(repoRoot, 'apps', 'frontend');
log(`📁 Chemin frontend: ${frontendPath}`, 'cyan');
log('');

log('💡 PROBLÈME IDENTIFIÉ:', 'yellow');
log('   Vercel CLI détecte le repo root comme étant apps/frontend', 'yellow');
log('   Mais le Root Directory dans settings est aussi apps/frontend', 'yellow');
log('   → Cela crée un doublon: apps/frontend/apps/frontend', 'yellow');
log('');

log('✅ SOLUTION:', 'green');
log('   Le Root Directory dans Vercel doit être VIDE', 'green');
log('   Car Vercel détecte déjà apps/frontend comme repo root', 'green');
log('');

log('📋 ÉTAPES:', 'blue');
log('   1. Aller sur: https://vercel.com/luneos-projects/frontend/settings/build-and-deployment', 'cyan');
log('   2. Section "Root Directory"', 'cyan');
log('   3. EFFACER la valeur "apps/frontend"', 'cyan');
log('   4. Laisser le champ VIDE', 'cyan');
log('   5. Cliquer sur "Save"', 'cyan');
log('');

log('🚀 Ensuite, exécuter:', 'blue');
log('   node scripts/deploy-with-logs.js', 'cyan');
log('');

// Essayer d'ouvrir la page
try {
  execSync('open "https://vercel.com/luneos-projects/frontend/settings/build-and-deployment"', { stdio: 'pipe' });
  log('✅ Page ouverte dans le navigateur', 'green');
} catch (error) {
  // Ignorer
}

log('');
log('⏳ Après avoir vidé le Root Directory, appuyez sur Entrée pour déployer...', 'yellow');
log('');

// Attendre l'entrée utilisateur (mais en mode non-interactif, on continue)
log('🚀 Tentative de déploiement...', 'blue');
log('');

// Déployer depuis apps/frontend directement
const deployProcess = spawn('vercel', ['--prod', '--yes'], {
  cwd: frontendPath,
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
  
  const urlMatch = output.match(/https:\/\/[^\s]+/);
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
    log(`✅ Frontend déployé: ${deploymentUrl}`, 'green');
  } else {
    log(`❌ Erreur (Code: ${code})`, 'red');
    log('');
    log('💡 Si l\'erreur persiste:', 'yellow');
    log('   1. Vider le Root Directory dans Vercel Settings', 'cyan');
    log('   2. Sauvegarder', 'cyan');
    log('   3. Redéployer depuis le dashboard Vercel', 'cyan');
  }
  
  log('');
  process.exit(code);
});

