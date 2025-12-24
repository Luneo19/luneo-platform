#!/usr/bin/env node

/**
 * Déploiement via API Vercel - Contourne le problème du double chemin CLI
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_AUTH_TOKEN;
const PROJECT_ID = 'prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9';
const TEAM_ID = 'team_hEYzAnyaxsCQkF2sJqEzWKS9';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN non défini');
  console.log('💡 Obtenez votre token: https://vercel.com/account/tokens');
  console.log('   Puis: export VERCEL_TOKEN=votre_token');
  process.exit(1);
}

console.log('🚀 Déploiement via API Vercel');
console.log('============================');
console.log('');

// Récupérer le dernier commit SHA
const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

let gitSha;
try {
  gitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  console.log(`📦 Commit SHA: ${gitSha.substring(0, 7)}`);
} catch (error) {
  console.error('❌ Erreur lors de la récupération du commit SHA');
  process.exit(1);
}

// Créer un déploiement via API
const deploymentData = JSON.stringify({
  name: 'frontend',
  projectSettings: {
    rootDirectory: 'apps/frontend'
  },
  gitSource: {
    type: 'github',
    repo: 'Luneo19/luneo-platform',
    ref: gitSha,
    sha: gitSha
  }
});

const options = {
  hostname: 'api.vercel.com',
  path: `/v13/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(deploymentData)
  }
};

console.log('📤 Création du déploiement...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const result = JSON.parse(data);
        console.log('');
        console.log('✅ Déploiement créé avec succès!');
        console.log(`🔗 Dashboard: https://vercel.com/luneos-projects/frontend/${result.id}`);
        console.log(`🌐 Preview: ${result.url || 'En cours de build...'}`);
        console.log('');
        console.log('⏳ Surveillez le build dans le dashboard Vercel');
      } catch (e) {
        console.log('✅ Réponse reçue:', data.substring(0, 200));
      }
    } else {
      console.error(`❌ Erreur ${res.statusCode}:`, data.substring(0, 500));
      console.log('');
      console.log('💡 Alternative: Utilisez le script deploy-frontend-smart.sh');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur réseau:', error.message);
  console.log('');
  console.log('💡 Alternative: Utilisez le script deploy-frontend-smart.sh');
});

req.write(deploymentData);
req.end();

