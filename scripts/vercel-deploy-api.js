#!/usr/bin/env node

/**
 * Script pour déployer via l'API Vercel
 * Contourne le problème du double chemin dans Vercel CLI
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9';
const TEAM_ID = 'team_hEYzAnyaxsCQkF2sJqEzWKS9';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN non défini');
  console.log('💡 Obtenez votre token: https://vercel.com/account/tokens');
  process.exit(1);
}

console.log('🚀 Déploiement via API Vercel...');
console.log(`📦 Project ID: ${PROJECT_ID}`);
console.log(`👥 Team ID: ${TEAM_ID}`);
console.log('');

// Créer un déploiement via API
const options = {
  hostname: 'api.vercel.com',
  path: `/v13/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('✅ Déploiement créé!');
      console.log(`🔗 URL: https://vercel.com/luneos-projects/frontend/${result.id}`);
      console.log(`🌐 Preview: ${result.url}`);
    } else {
      console.error(`❌ Erreur ${res.statusCode}:`, data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur:', error.message);
});

// Note: Pour un vrai déploiement, il faudrait uploader les fichiers
// Pour l'instant, on déclenche juste via Git
req.end();

console.log('💡 Note: Le déploiement réel se fait via Git push');
console.log('   Le Root Directory doit être configuré dans Vercel Dashboard');

