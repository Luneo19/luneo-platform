#!/usr/bin/env node

/**
 * Script complet pour configurer le webhook Stripe et récupérer le secret
 * Utilise l'API Stripe directement pour récupérer le secret de création
 */

const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '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';
const BACKEND_URL = process.env.BACKEND_URL || process.env.VERCEL_URL || 'https://api.luneo.app';
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/webhooks/stripe`;

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];

async function completeWebhookSetup() {
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  console.log('🔧 Configuration complète du webhook Stripe\n');
  console.log(`📍 Endpoint: ${WEBHOOK_ENDPOINT}\n`);

  try {
    // 1. Vérifier les webhooks existants
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    let webhook = existingWebhooks.data.find((wh) => wh.url === WEBHOOK_ENDPOINT);

    if (!webhook) {
      // Créer le webhook
      console.log('🆕 Création du webhook...');
      webhook = await stripe.webhookEndpoints.create({
        url: WEBHOOK_ENDPOINT,
        enabled_events: WEBHOOK_EVENTS,
        description: 'Luneo Platform - Webhook pour paiements et abonnements',
        api_version: '2025-12-15.clover',
      });
      console.log('✅ Webhook créé!\n');
    } else {
      console.log('✅ Webhook existant trouvé\n');
    }

    console.log(`📊 Webhook ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Statut: ${webhook.status}\n`);

    // 2. Récupérer le secret depuis le dashboard Stripe
    // Note: Le secret n'est disponible que lors de la création initiale
    // Pour les webhooks existants, il faut le récupérer depuis le dashboard
    
    console.log('🔐 Récupération du webhook secret...\n');
    console.log('⚠️  Le secret doit être récupéré depuis le dashboard Stripe.');
    console.log('   Stripe ne le retourne pas via l\'API pour des raisons de sécurité.\n');
    
    // Utiliser l'API Stripe pour récupérer les sign secrets
    try {
      // Récupérer le webhook avec tous les détails
      const webhookDetails = await stripe.webhookEndpoints.retrieve(webhook.id);
      
      // Le secret n'est pas dans la réponse, mais on peut utiliser l'API REST directement
      const https = require('https');
      const url = require('url');
      
      const secretUrl = `https://api.stripe.com/v1/webhook_endpoints/${webhook.id}`;
      const parsedUrl = url.parse(secretUrl);
      
      return new Promise((resolve, reject) => {
        const options = {
          hostname: parsedUrl.hostname,
          path: parsedUrl.path,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (response.secret) {
                resolve(response.secret);
              } else {
                // Le secret n'est pas disponible, utiliser le dashboard
                console.log('📋 Instructions pour récupérer le secret:\n');
                console.log(`   1. Allez sur: https://dashboard.stripe.com/webhooks/${webhook.id}`);
                console.log('   2. Cliquez sur "Reveal" dans "Signing secret"');
                console.log('   3. Copiez le secret (whsec_...)\n');
                resolve(null);
              }
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });
    } catch (error) {
      console.log('⚠️  Impossible de récupérer le secret via l\'API\n');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

// Fonction pour ajouter dans Vercel
async function addToVercel(secret, webhookId) {
  if (!secret) {
    console.log('📝 Pour ajouter manuellement dans Vercel:\n');
    console.log('   1. Récupérez le secret depuis: https://dashboard.stripe.com/webhooks/' + webhookId);
    console.log('   2. Exécutez: vercel env add STRIPE_WEBHOOK_SECRET production');
    console.log('   3. Collez le secret\n');
    return;
  }

  try {
    console.log('🚀 Ajout dans Vercel...\n');
    
    // Vérifier la connexion Vercel
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Non connecté à Vercel CLI');
      console.log('   Connectez-vous: vercel login\n');
      return;
    }

    // Ajouter la variable
    const command = `echo "${secret}" | vercel env add STRIPE_WEBHOOK_SECRET production --force`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ Variable ajoutée dans Vercel!\n');
  } catch (error) {
    console.log('⚠️  Erreur lors de l\'ajout automatique');
    console.log('   Ajout manuel requis\n');
  }
}

// Exécuter
completeWebhookSetup()
  .then(async (secret) => {
    const webhookId = 'we_1SgixRKG9MsM6fdSbBmG84sR';
    
    if (secret) {
      console.log(`\n🔐 Secret récupéré: ${secret.substring(0, 20)}...\n`);
      await addToVercel(secret, webhookId);
    } else {
      await addToVercel(null, webhookId);
    }
    
    console.log('✅ Configuration terminée!\n');
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });


#!/usr/bin/env node

/**
 * Script complet pour configurer le webhook Stripe et récupérer le secret
 * Utilise l'API Stripe directement pour récupérer le secret de création
 */

const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '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';
const BACKEND_URL = process.env.BACKEND_URL || process.env.VERCEL_URL || 'https://api.luneo.app';
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/webhooks/stripe`;

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];

async function completeWebhookSetup() {
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  console.log('🔧 Configuration complète du webhook Stripe\n');
  console.log(`📍 Endpoint: ${WEBHOOK_ENDPOINT}\n`);

  try {
    // 1. Vérifier les webhooks existants
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    let webhook = existingWebhooks.data.find((wh) => wh.url === WEBHOOK_ENDPOINT);

    if (!webhook) {
      // Créer le webhook
      console.log('🆕 Création du webhook...');
      webhook = await stripe.webhookEndpoints.create({
        url: WEBHOOK_ENDPOINT,
        enabled_events: WEBHOOK_EVENTS,
        description: 'Luneo Platform - Webhook pour paiements et abonnements',
        api_version: '2025-12-15.clover',
      });
      console.log('✅ Webhook créé!\n');
    } else {
      console.log('✅ Webhook existant trouvé\n');
    }

    console.log(`📊 Webhook ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Statut: ${webhook.status}\n`);

    // 2. Récupérer le secret depuis le dashboard Stripe
    // Note: Le secret n'est disponible que lors de la création initiale
    // Pour les webhooks existants, il faut le récupérer depuis le dashboard
    
    console.log('🔐 Récupération du webhook secret...\n');
    console.log('⚠️  Le secret doit être récupéré depuis le dashboard Stripe.');
    console.log('   Stripe ne le retourne pas via l\'API pour des raisons de sécurité.\n');
    
    // Utiliser l'API Stripe pour récupérer les sign secrets
    try {
      // Récupérer le webhook avec tous les détails
      const webhookDetails = await stripe.webhookEndpoints.retrieve(webhook.id);
      
      // Le secret n'est pas dans la réponse, mais on peut utiliser l'API REST directement
      const https = require('https');
      const url = require('url');
      
      const secretUrl = `https://api.stripe.com/v1/webhook_endpoints/${webhook.id}`;
      const parsedUrl = url.parse(secretUrl);
      
      return new Promise((resolve, reject) => {
        const options = {
          hostname: parsedUrl.hostname,
          path: parsedUrl.path,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (response.secret) {
                resolve(response.secret);
              } else {
                // Le secret n'est pas disponible, utiliser le dashboard
                console.log('📋 Instructions pour récupérer le secret:\n');
                console.log(`   1. Allez sur: https://dashboard.stripe.com/webhooks/${webhook.id}`);
                console.log('   2. Cliquez sur "Reveal" dans "Signing secret"');
                console.log('   3. Copiez le secret (whsec_...)\n');
                resolve(null);
              }
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });
    } catch (error) {
      console.log('⚠️  Impossible de récupérer le secret via l\'API\n');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

// Fonction pour ajouter dans Vercel
async function addToVercel(secret, webhookId) {
  if (!secret) {
    console.log('📝 Pour ajouter manuellement dans Vercel:\n');
    console.log('   1. Récupérez le secret depuis: https://dashboard.stripe.com/webhooks/' + webhookId);
    console.log('   2. Exécutez: vercel env add STRIPE_WEBHOOK_SECRET production');
    console.log('   3. Collez le secret\n');
    return;
  }

  try {
    console.log('🚀 Ajout dans Vercel...\n');
    
    // Vérifier la connexion Vercel
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Non connecté à Vercel CLI');
      console.log('   Connectez-vous: vercel login\n');
      return;
    }

    // Ajouter la variable
    const command = `echo "${secret}" | vercel env add STRIPE_WEBHOOK_SECRET production --force`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ Variable ajoutée dans Vercel!\n');
  } catch (error) {
    console.log('⚠️  Erreur lors de l\'ajout automatique');
    console.log('   Ajout manuel requis\n');
  }
}

// Exécuter
completeWebhookSetup()
  .then(async (secret) => {
    const webhookId = 'we_1SgixRKG9MsM6fdSbBmG84sR';
    
    if (secret) {
      console.log(`\n🔐 Secret récupéré: ${secret.substring(0, 20)}...\n`);
      await addToVercel(secret, webhookId);
    } else {
      await addToVercel(null, webhookId);
    }
    
    console.log('✅ Configuration terminée!\n');
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
















