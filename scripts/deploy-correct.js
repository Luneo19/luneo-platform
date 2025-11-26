#!/usr/bin/env node

/**
 * Script pour déployer correctement le frontend
 * Le Root Directory doit être "apps/frontend" ET on doit déployer depuis apps/frontend
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
log('║  DÉPLOIEMENT CORRECT - FRONTEND                             ║', 'cyan');
log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
log('');

log('🔍 ANALYSE:', 'blue');
log('');

const repoRoot = path.join(__dirname, '..');
const frontendPath = path.join(repoRoot, 'apps', 'frontend');

// Vérifier que package.json existe dans frontend
if (!fs.existsSync(path.join(frontendPath, 'package.json'))) {
  log('❌ package.json non trouvé dans apps/frontend', 'red');
  process.exit(1);
}

log(`✅ package.json trouvé dans apps/frontend`, 'green');

// Vérifier Next.js
const packageJson = JSON.parse(fs.readFileSync(path.join(frontendPath, 'package.json'), 'utf-8'));
const hasNext = packageJson.dependencies?.next || packageJson.devDependencies?.next;

if (!hasNext) {
  log('❌ Next.js non trouvé dans package.json', 'red');
  process.exit(1);
}

log(`✅ Next.js trouvé: ${hasNext}`, 'green');
log('');

log('💡 SOLUTION:', 'yellow');
log('   Le Root Directory doit être "apps/frontend" dans Vercel', 'yellow');
log('   ET on doit déployer depuis apps/frontend directement', 'yellow');
log('');

log('🚀 Déploiement depuis apps/frontend...', 'blue');
log('📋 Logs complets:', 'yellow');
log('');

// Déployer depuis apps/frontend
const deployProcess = spawn('vercel', ['--prod', '--yes'], {
  cwd: frontendPath,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let stdout = '';
let stderr = '';
let deploymentUrl = null;
let buildStarted = false;

deployProcess.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  process.stdout.write(output);
  
  const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
  if (urlMatch) {
    deploymentUrl = urlMatch[0];
  }
  
  if (output.includes('Building') || output.includes('Installing')) {
    buildStarted = true;
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
    log('');
    log('📋 Vérifier:', 'blue');
    log(`   ${deploymentUrl}`, 'cyan');
  } else {
    log(`❌ Erreur (Code: ${code})`, 'red');
    log('');
    
    // Analyser l'erreur
    const fullOutput = stdout + stderr;
    
    if (fullOutput.includes('No Next.js version detected')) {
      log('💡 Erreur: Next.js non détecté', 'yellow');
      log('   Vérifier que le Root Directory est bien "apps/frontend"', 'yellow');
      log('   https://vercel.com/luneos-projects/frontend/settings/build-and-deployment', 'cyan');
    } else if (fullOutput.includes('root directory') || fullOutput.includes('path') && fullOutput.includes('does not exist')) {
      log('💡 Erreur: Root Directory mal configuré', 'yellow');
      log('   Le Root Directory doit être "apps/frontend"', 'yellow');
      log('   https://vercel.com/luneos-projects/frontend/settings/build-and-deployment', 'cyan');
    } else if (buildStarted) {
      log('⚠️  Le build a commencé mais a échoué', 'yellow');
      log('   Vérifier les logs ci-dessus pour plus de détails', 'yellow');
      log('   Ou vérifier sur: https://vercel.com/luneos-projects/frontend', 'cyan');
    }
  }
  
  log('');
  process.exit(code);
});

