#!/usr/bin/env node

/**
 * Script pour récupérer les logs Vercel via l'API
 */

const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9';
const TEAM_ID = 'team_hEYzAnyaxsCQkF2sJqEzWKS9';

// Récupérer le token Vercel
let token;
try {
  const whoami = execSync('vercel whoami', { encoding: 'utf-8' }).trim();
  console.log(`✅ Connecté en tant que: ${whoami}`);
  
  // Essayer de récupérer le token depuis l'environnement ou la config
  token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.log('⚠️  VERCEL_TOKEN non trouvé dans l\'environnement');
    console.log('💡 Pour obtenir les logs, allez sur:');
    console.log(`   https://vercel.com/luneos-projects/frontend/deployments`);
    process.exit(0);
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

// Récupérer les déploiements
function getDeployments() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=1`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Récupérer les logs d'un déploiement
function getDeploymentLogs(deploymentId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v2/deployments/${deploymentId}/events?teamId=${TEAM_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Main
(async () => {
  try {
    console.log('📋 Récupération des déploiements...\n');
    const deployments = await getDeployments();
    
    if (deployments.deployments && deployments.deployments.length > 0) {
      const latest = deployments.deployments[0];
      console.log(`📦 Dernier déploiement:`);
      console.log(`   URL: ${latest.url}`);
      console.log(`   Statut: ${latest.readyState || latest.state}`);
      console.log(`   ID: ${latest.uid}\n`);
      
      if (latest.readyState === 'ERROR' || latest.state === 'ERROR') {
        console.log('📋 Récupération des logs d\'erreur...\n');
        try {
          const logs = await getDeploymentLogs(latest.uid);
          if (logs.events && logs.events.length > 0) {
            console.log('📄 Logs du déploiement:\n');
            logs.events.forEach(event => {
              if (event.type === 'stdout' || event.type === 'stderr') {
                console.log(event.payload.text || event.payload);
              }
            });
          } else {
            console.log('⚠️  Aucun log disponible');
            console.log('💡 Consultez les logs sur:');
            console.log(`   https://vercel.com/luneos-projects/frontend/${latest.uid}`);
          }
        } catch (error) {
          console.error('❌ Erreur lors de la récupération des logs:', error.message);
          console.log('💡 Consultez les logs sur:');
          console.log(`   https://vercel.com/luneos-projects/frontend/${latest.uid}`);
        }
      }
    } else {
      console.log('⚠️  Aucun déploiement trouvé');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Pour voir les logs, allez sur:');
    console.log('   https://vercel.com/luneos-projects/frontend/deployments');
  }
})();










