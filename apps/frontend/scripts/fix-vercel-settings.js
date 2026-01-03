#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les paramètres Vercel Dashboard
 * via l'API Vercel
 */

const https = require('https');
const { execSync } = require('child_process');

// Récupérer les IDs depuis .vercel/project.json
const fs = require('fs');
const path = require('path');

const projectJsonPath = path.join(__dirname, '..', '.vercel', 'project.json');

if (!fs.existsSync(projectJsonPath)) {
  console.error('❌ .vercel/project.json not found');
  process.exit(1);
}

const projectConfig = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
const PROJECT_ID = projectConfig.projectId;
const TEAM_ID = projectConfig.orgId;

console.log('📋 Configuration Vercel');
console.log(`   Project ID: ${PROJECT_ID}`);
console.log(`   Team ID: ${TEAM_ID}`);
console.log('');

// Récupérer le token Vercel
let VERCEL_TOKEN;
try {
  // Essayer de récupérer depuis l'environnement
  VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  
  if (!VERCEL_TOKEN) {
    // Essayer depuis la config Vercel CLI
    try {
      const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.vercel', 'auth.json');
      if (fs.existsSync(configPath)) {
        const auth = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        VERCEL_TOKEN = Object.values(auth)[0]?.token;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN not found. Please set it:');
    console.error('   export VERCEL_TOKEN="your-token"');
    console.error('   Or get it from: https://vercel.com/account/tokens');
    process.exit(1);
  }
} catch (e) {
  console.error('❌ Error getting Vercel token:', e.message);
  process.exit(1);
}

// Fonction pour faire une requête API Vercel
function vercelApiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.vercel.com${endpoint}`);
    if (TEAM_ID) {
      url.searchParams.append('teamId', TEAM_ID);
    }

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}, Body: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Fonction principale
async function main() {
  console.log('🔄 Récupération de la configuration actuelle...');
  
  try {
    // Récupérer la configuration actuelle
    const currentConfig = await vercelApiRequest('GET', `/v9/projects/${PROJECT_ID}`);
    
    console.log('📊 Configuration actuelle:');
    console.log(`   Framework: ${currentConfig.framework || 'Not set'}`);
    console.log(`   Build Command: ${currentConfig.buildCommand || 'Not set'}`);
    console.log(`   Output Directory: ${currentConfig.outputDirectory || 'Not set'}`);
    console.log(`   Install Command: ${currentConfig.installCommand || 'Not set'}`);
    console.log('');
    
    // Préparer les nouvelles valeurs
    const updates = {};
    let hasChanges = false;
    
    // Framework Preset
    if (currentConfig.framework !== 'nextjs') {
      updates.framework = 'nextjs';
      hasChanges = true;
      console.log('✅ Framework Preset: nextjs');
    }
    
    // Build Command - Laisser vide pour utiliser vercel.json
    if (currentConfig.buildCommand !== undefined && currentConfig.buildCommand !== null) {
      updates.buildCommand = null; // null = utiliser vercel.json
      hasChanges = true;
      console.log('✅ Build Command: (vide - utilise vercel.json)');
    }
    
    // Output Directory
    if (currentConfig.outputDirectory !== '.next') {
      updates.outputDirectory = '.next';
      hasChanges = true;
      console.log('✅ Output Directory: .next');
    }
    
    // Install Command - Laisser vide pour utiliser vercel.json
    if (currentConfig.installCommand !== undefined && currentConfig.installCommand !== null) {
      updates.installCommand = null; // null = utiliser vercel.json
      hasChanges = true;
      console.log('✅ Install Command: (vide - utilise vercel.json)');
    }
    
    if (!hasChanges) {
      console.log('✅ Configuration déjà correcte !');
      return;
    }
    
    console.log('');
    console.log('🔄 Mise à jour de la configuration...');
    
    // Mettre à jour la configuration
    const updated = await vercelApiRequest('PATCH', `/v9/projects/${PROJECT_ID}`, updates);
    
    console.log('✅ Configuration mise à jour avec succès !');
    console.log('');
    console.log('📊 Nouvelle configuration:');
    console.log(`   Framework: ${updated.framework || 'Not set'}`);
    console.log(`   Build Command: ${updated.buildCommand === null ? '(vide - utilise vercel.json)' : updated.buildCommand}`);
    console.log(`   Output Directory: ${updated.outputDirectory || 'Not set'}`);
    console.log(`   Install Command: ${updated.installCommand === null ? '(vide - utilise vercel.json)' : updated.installCommand}`);
    console.log('');
    console.log('🚀 Prochaine étape: Déclencher un nouveau déploiement');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('');
      console.error('💡 Le token Vercel n\'a pas les permissions nécessaires.');
      console.error('   Créez un nouveau token avec les permissions "Full Account Access":');
      console.error('   https://vercel.com/account/tokens');
    }
    process.exit(1);
  }
}

main().catch(console.error);








