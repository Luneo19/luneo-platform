#!/usr/bin/env node

/**
 * Script pour configurer automatiquement le webhook Stripe
 * - Recrée le webhook pour obtenir le secret
 * - Ajoute automatiquement dans Vercel
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

async function autoConfigureWebhook() {
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  console.log('🔧 Configuration automatique du webhook Stripe\n');
  console.log(`📍 Endpoint: ${WEBHOOK_ENDPOINT}\n`);

  try {
    // 1. Vérifier les webhooks existants
    console.log('📋 Recherche des webhooks existants...');
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existingWebhook = existingWebhooks.data.find((wh) => wh.url === WEBHOOK_ENDPOINT);

    let webhook;
    let webhookSecret;

    if (existingWebhook) {
      console.log(`✅ Webhook existant trouvé: ${existingWebhook.id}`);
      
      // Le secret n'est pas disponible via l'API pour les webhooks existants
      // On doit le recréer pour obtenir le secret
      console.log('⚠️  Le secret n\'est pas disponible pour les webhooks existants.');
      console.log('🔄 Recréation du webhook pour obtenir le secret...\n');
      
      // Supprimer l'ancien webhook
      await stripe.webhookEndpoints.del(existingWebhook.id);
      console.log('✅ Ancien webhook supprimé\n');
    }

    // 2. Créer un nouveau webhook (le secret est dans la réponse)
    console.log('🆕 Création d\'un nouveau webhook...');
    webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_ENDPOINT,
      enabled_events: WEBHOOK_EVENTS,
      description: 'Luneo Platform - Webhook pour paiements et abonnements',
      api_version: '2025-12-15.clover',
    });

    // Le secret est disponible lors de la création
    webhookSecret = webhook.secret;

    if (!webhookSecret) {
      // Parfois le secret n'est pas dans la réponse directe
      // Il faut le récupérer depuis les sign secrets
      try {
        const retrieved = await stripe.webhookEndpoints.retrieve(webhook.id);
        webhookSecret = retrieved.secret;
      } catch (error) {
        console.log('⚠️  Secret non disponible dans la réponse');
      }
    }

    console.log('✅ Webhook créé avec succès!');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Statut: ${webhook.status}`);
    
    if (webhookSecret) {
      console.log(`   Secret: ${webhookSecret.substring(0, 20)}...\n`);
    } else {
      console.log('   Secret: Non disponible (à récupérer depuis le dashboard)\n');
    }

    // 3. Afficher les événements
    console.log('📋 Événements configurés:');
    WEBHOOK_EVENTS.forEach((event) => {
      console.log(`   ✅ ${event}`);
    });
    console.log('');

    // 4. Ajouter dans Vercel automatiquement
    if (webhookSecret) {
      console.log('🚀 Ajout automatique dans Vercel...\n');
      
      try {
        // Vérifier la connexion Vercel
        try {
          execSync('vercel whoami', { stdio: 'ignore' });
          console.log('✅ Connecté à Vercel\n');
        } catch {
          console.log('⚠️  Non connecté à Vercel CLI');
          console.log('   Connectez-vous: vercel login\n');
          console.log('📝 Pour ajouter manuellement:');
          console.log(`   vercel env add STRIPE_WEBHOOK_SECRET production`);
          console.log(`   Valeur: ${webhookSecret}\n`);
          return { webhookId: webhook.id, webhookSecret };
        }

        // Ajouter la variable
        console.log('📝 Ajout de STRIPE_WEBHOOK_SECRET dans Vercel...');
        const command = `echo "${webhookSecret}" | vercel env add STRIPE_WEBHOOK_SECRET production --force 2>&1`;
        
        try {
          const output = execSync(command, { encoding: 'utf8' });
          console.log(output);
          console.log('\n✅ Variable ajoutée dans Vercel avec succès!\n');
        } catch (error) {
          console.log('⚠️  Erreur lors de l\'ajout automatique:');
          console.log(error.message);
          console.log('\n📝 Ajout manuel:');
          console.log(`   vercel env add STRIPE_WEBHOOK_SECRET production`);
          console.log(`   Valeur: ${webhookSecret}\n`);
        }
      } catch (error) {
        console.log('⚠️  Erreur lors de l\'ajout dans Vercel');
        console.log('📝 Ajout manuel requis:\n');
        console.log(`   vercel env add STRIPE_WEBHOOK_SECRET production`);
        console.log(`   Valeur: ${webhookSecret}\n`);
      }
    } else {
      console.log('📝 Pour récupérer le secret:');
      console.log(`   1. Allez sur: https://dashboard.stripe.com/webhooks/${webhook.id}`);
      console.log('   2. Cliquez sur "Reveal" dans "Signing secret"');
      console.log('   3. Copiez le secret (whsec_...)\n');
    }

    // 5. Mettre à jour .env.production
    const envPath = path.join(__dirname, '../.env.production');
    if (fs.existsSync(envPath) && webhookSecret) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
        envContent = envContent.replace(
          /STRIPE_WEBHOOK_SECRET=.*/,
          `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
        );
      } else {
        envContent += `\nSTRIPE_WEBHOOK_SECRET=${webhookSecret}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ STRIPE_WEBHOOK_SECRET ajouté dans .env.production\n');
    }

    console.log('✅ Configuration terminée avec succès!\n');
    console.log('📊 Résumé:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Webhook ID:     ${webhook.id}`);
    console.log(`URL:            ${webhook.url}`);
    console.log(`Statut:         ${webhook.status}`);
    console.log(`Événements:     ${webhook.enabled_events.length} configurés`);
    if (webhookSecret) {
      console.log(`Secret:         ${webhookSecret.substring(0, 20)}...`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      webhookId: webhook.id,
      webhookUrl: webhook.url,
      webhookSecret: webhookSecret || 'À récupérer depuis le dashboard',
      events: webhook.enabled_events,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    if (error.type) {
      console.error(`   Type: ${error.type}`);
    }
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    throw error;
  }
}

// Exécuter
autoConfigureWebhook()
  .then((result) => {
    console.log('🎉 Configuration terminée!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });


#!/usr/bin/env node

/**
 * Script pour configurer automatiquement le webhook Stripe
 * - Recrée le webhook pour obtenir le secret
 * - Ajoute automatiquement dans Vercel
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

async function autoConfigureWebhook() {
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  console.log('🔧 Configuration automatique du webhook Stripe\n');
  console.log(`📍 Endpoint: ${WEBHOOK_ENDPOINT}\n`);

  try {
    // 1. Vérifier les webhooks existants
    console.log('📋 Recherche des webhooks existants...');
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existingWebhook = existingWebhooks.data.find((wh) => wh.url === WEBHOOK_ENDPOINT);

    let webhook;
    let webhookSecret;

    if (existingWebhook) {
      console.log(`✅ Webhook existant trouvé: ${existingWebhook.id}`);
      
      // Le secret n'est pas disponible via l'API pour les webhooks existants
      // On doit le recréer pour obtenir le secret
      console.log('⚠️  Le secret n\'est pas disponible pour les webhooks existants.');
      console.log('🔄 Recréation du webhook pour obtenir le secret...\n');
      
      // Supprimer l'ancien webhook
      await stripe.webhookEndpoints.del(existingWebhook.id);
      console.log('✅ Ancien webhook supprimé\n');
    }

    // 2. Créer un nouveau webhook (le secret est dans la réponse)
    console.log('🆕 Création d\'un nouveau webhook...');
    webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_ENDPOINT,
      enabled_events: WEBHOOK_EVENTS,
      description: 'Luneo Platform - Webhook pour paiements et abonnements',
      api_version: '2025-12-15.clover',
    });

    // Le secret est disponible lors de la création
    webhookSecret = webhook.secret;

    if (!webhookSecret) {
      // Parfois le secret n'est pas dans la réponse directe
      // Il faut le récupérer depuis les sign secrets
      try {
        const retrieved = await stripe.webhookEndpoints.retrieve(webhook.id);
        webhookSecret = retrieved.secret;
      } catch (error) {
        console.log('⚠️  Secret non disponible dans la réponse');
      }
    }

    console.log('✅ Webhook créé avec succès!');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Statut: ${webhook.status}`);
    
    if (webhookSecret) {
      console.log(`   Secret: ${webhookSecret.substring(0, 20)}...\n`);
    } else {
      console.log('   Secret: Non disponible (à récupérer depuis le dashboard)\n');
    }

    // 3. Afficher les événements
    console.log('📋 Événements configurés:');
    WEBHOOK_EVENTS.forEach((event) => {
      console.log(`   ✅ ${event}`);
    });
    console.log('');

    // 4. Ajouter dans Vercel automatiquement
    if (webhookSecret) {
      console.log('🚀 Ajout automatique dans Vercel...\n');
      
      try {
        // Vérifier la connexion Vercel
        try {
          execSync('vercel whoami', { stdio: 'ignore' });
          console.log('✅ Connecté à Vercel\n');
        } catch {
          console.log('⚠️  Non connecté à Vercel CLI');
          console.log('   Connectez-vous: vercel login\n');
          console.log('📝 Pour ajouter manuellement:');
          console.log(`   vercel env add STRIPE_WEBHOOK_SECRET production`);
          console.log(`   Valeur: ${webhookSecret}\n`);
          return { webhookId: webhook.id, webhookSecret };
        }

        // Ajouter la variable
        console.log('📝 Ajout de STRIPE_WEBHOOK_SECRET dans Vercel...');
        const command = `echo "${webhookSecret}" | vercel env add STRIPE_WEBHOOK_SECRET production --force 2>&1`;
        
        try {
          const output = execSync(command, { encoding: 'utf8' });
          console.log(output);
          console.log('\n✅ Variable ajoutée dans Vercel avec succès!\n');
        } catch (error) {
          console.log('⚠️  Erreur lors de l\'ajout automatique:');
          console.log(error.message);
          console.log('\n📝 Ajout manuel:');
          console.log(`   vercel env add STRIPE_WEBHOOK_SECRET production`);
          console.log(`   Valeur: ${webhookSecret}\n`);
        }
      } catch (error) {
        console.log('⚠️  Erreur lors de l\'ajout dans Vercel');
        console.log('📝 Ajout manuel requis:\n');
        console.log(`   vercel env add STRIPE_WEBHOOK_SECRET production`);
        console.log(`   Valeur: ${webhookSecret}\n`);
      }
    } else {
      console.log('📝 Pour récupérer le secret:');
      console.log(`   1. Allez sur: https://dashboard.stripe.com/webhooks/${webhook.id}`);
      console.log('   2. Cliquez sur "Reveal" dans "Signing secret"');
      console.log('   3. Copiez le secret (whsec_...)\n');
    }

    // 5. Mettre à jour .env.production
    const envPath = path.join(__dirname, '../.env.production');
    if (fs.existsSync(envPath) && webhookSecret) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
        envContent = envContent.replace(
          /STRIPE_WEBHOOK_SECRET=.*/,
          `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
        );
      } else {
        envContent += `\nSTRIPE_WEBHOOK_SECRET=${webhookSecret}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ STRIPE_WEBHOOK_SECRET ajouté dans .env.production\n');
    }

    console.log('✅ Configuration terminée avec succès!\n');
    console.log('📊 Résumé:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Webhook ID:     ${webhook.id}`);
    console.log(`URL:            ${webhook.url}`);
    console.log(`Statut:         ${webhook.status}`);
    console.log(`Événements:     ${webhook.enabled_events.length} configurés`);
    if (webhookSecret) {
      console.log(`Secret:         ${webhookSecret.substring(0, 20)}...`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      webhookId: webhook.id,
      webhookUrl: webhook.url,
      webhookSecret: webhookSecret || 'À récupérer depuis le dashboard',
      events: webhook.enabled_events,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    if (error.type) {
      console.error(`   Type: ${error.type}`);
    }
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    throw error;
  }
}

// Exécuter
autoConfigureWebhook()
  .then((result) => {
    console.log('🎉 Configuration terminée!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });















