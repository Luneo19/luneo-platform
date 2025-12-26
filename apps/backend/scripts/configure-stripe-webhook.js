#!/usr/bin/env node

/**
 * Script pour configurer automatiquement le webhook Stripe
 * - Crée le webhook endpoint
 * - Configure les événements nécessaires
 * - Récupère le webhook secret
 * - Met à jour les variables d'environnement
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

// Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const BACKEND_URL = process.env.BACKEND_URL || process.env.VERCEL_URL || 'https://api.luneo.app';
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/webhooks/stripe`;

// Événements Stripe à écouter
const WEBHOOK_EVENTS = [
  'checkout.session.completed',      // Paiement réussi (abonnements + crédits)
  'payment_intent.succeeded',         // Paiement réussi
  'payment_intent.payment_failed',    // Échec paiement
  'customer.subscription.created',    // Abonnement créé
  'customer.subscription.updated',    // Abonnement modifié
  'customer.subscription.deleted',    // Abonnement annulé
  'invoice.payment_succeeded',       // Facture payée
  'invoice.payment_failed',          // Échec facture
];

async function configureWebhook() {
  if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY non trouvée dans .env.production');
    process.exit(1);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  console.log('🔧 Configuration du webhook Stripe...\n');
  console.log(`📍 Endpoint: ${WEBHOOK_ENDPOINT}\n`);

  try {
    // 1. Lister les webhooks existants
    console.log('📋 Recherche des webhooks existants...');
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    // Chercher un webhook existant pour cet endpoint
    let webhook = existingWebhooks.data.find(
      (wh) => wh.url === WEBHOOK_ENDPOINT
    );

    if (webhook) {
      console.log(`✅ Webhook existant trouvé: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Statut: ${webhook.status}`);
      
      // Vérifier si les événements sont corrects
      const currentEvents = webhook.enabled_events || [];
      const missingEvents = WEBHOOK_EVENTS.filter(
        (event) => !currentEvents.includes(event)
      );

      if (missingEvents.length > 0) {
        console.log(`\n⚠️  Événements manquants: ${missingEvents.join(', ')}`);
        console.log('🔄 Mise à jour du webhook...');
        
        webhook = await stripe.webhookEndpoints.update(webhook.id, {
          enabled_events: WEBHOOK_EVENTS,
        });
        
        console.log('✅ Webhook mis à jour avec succès!');
      } else {
        console.log('✅ Tous les événements sont déjà configurés!');
      }
    } else {
      // 2. Créer un nouveau webhook
      console.log('🆕 Création d\'un nouveau webhook...');
      
      webhook = await stripe.webhookEndpoints.create({
        url: WEBHOOK_ENDPOINT,
        enabled_events: WEBHOOK_EVENTS,
        description: 'Luneo Platform - Webhook pour paiements et abonnements',
        api_version: '2025-12-15.clover',
      });

      console.log('✅ Webhook créé avec succès!');
      console.log(`   ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Statut: ${webhook.status}`);
    }

    // 3. Récupérer le webhook secret
    console.log('\n🔐 Récupération du webhook secret...');
    
    // Le secret est dans webhook.secret (pour les nouveaux) ou il faut le récupérer
    let webhookSecret = webhook.secret;
    
    if (!webhookSecret) {
      // Pour les webhooks existants, récupérer le secret depuis les sign secrets
      const signSecrets = await stripe.webhookEndpoints.retrieve(webhook.id);
      // Le secret n'est pas retourné par l'API pour des raisons de sécurité
      // Il faut le récupérer depuis le dashboard ou utiliser le dernier secret connu
      console.log('⚠️  Le secret n\'est pas disponible via l\'API.');
      console.log('   Vous devez le récupérer depuis: https://dashboard.stripe.com/webhooks');
      console.log(`   Webhook ID: ${webhook.id}`);
    } else {
      webhookSecret = webhook.secret;
    }

    // 4. Afficher les informations
    console.log('\n📊 Configuration du webhook:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Webhook ID:     ${webhook.id}`);
    console.log(`URL:            ${webhook.url}`);
    console.log(`Statut:         ${webhook.status}`);
    console.log(`Événements:     ${webhook.enabled_events.length} configurés`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Événements configurés:');
    WEBHOOK_EVENTS.forEach((event) => {
      const isEnabled = webhook.enabled_events.includes(event);
      console.log(`   ${isEnabled ? '✅' : '❌'} ${event}`);
    });

    // 5. Instructions pour récupérer le secret
    console.log('\n🔐 Pour récupérer le Webhook Secret:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Aller sur: https://dashboard.stripe.com/webhooks');
    console.log(`2. Cliquer sur le webhook: ${webhook.id}`);
    console.log('3. Dans "Signing secret", cliquer sur "Reveal"');
    console.log('4. Copier le secret (commence par whsec_...)');
    console.log('5. Ajouter dans Vercel: STRIPE_WEBHOOK_SECRET');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 6. Essayer de mettre à jour .env.production si possible
    const envPath = path.join(__dirname, '../.env.production');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Mettre à jour ou ajouter STRIPE_WEBHOOK_SECRET
      if (webhookSecret) {
        if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
          envContent = envContent.replace(
            /STRIPE_WEBHOOK_SECRET=.*/,
            `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
          );
        } else {
          envContent += `\nSTRIPE_WEBHOOK_SECRET=${webhookSecret}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ STRIPE_WEBHOOK_SECRET ajouté dans .env.production');
      } else {
        console.log('⚠️  STRIPE_WEBHOOK_SECRET non disponible, ajoutez-le manuellement');
      }
    }

    // 7. Générer un script pour Vercel
    const vercelScript = `#!/bin/bash
# Script pour ajouter STRIPE_WEBHOOK_SECRET dans Vercel
# Utilisez: vercel env add STRIPE_WEBHOOK_SECRET production

echo "Pour ajouter le webhook secret dans Vercel:"
echo "1. Exécutez: vercel env add STRIPE_WEBHOOK_SECRET production"
echo "2. Collez le secret (whsec_...)"
echo ""
echo "Ou via le dashboard Vercel:"
echo "1. Allez dans Settings > Environment Variables"
echo "2. Ajoutez STRIPE_WEBHOOK_SECRET"
echo "3. Valeur: (récupérez depuis https://dashboard.stripe.com/webhooks)"
`;

    const scriptPath = path.join(__dirname, '../scripts/add-webhook-secret-to-vercel.sh');
    fs.writeFileSync(scriptPath, vercelScript);
    fs.chmodSync(scriptPath, '755');
    console.log(`✅ Script Vercel créé: ${scriptPath}\n`);

    console.log('✅ Configuration terminée avec succès!\n');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Récupérer le webhook secret depuis le dashboard Stripe');
    console.log('   2. L\'ajouter dans Vercel (Settings > Environment Variables)');
    console.log('   3. Tester le webhook avec: stripe listen --forward-to ' + WEBHOOK_ENDPOINT);

    return {
      webhookId: webhook.id,
      webhookUrl: webhook.url,
      webhookSecret: webhookSecret || 'À récupérer depuis le dashboard',
      events: webhook.enabled_events,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du webhook:', error.message);
    if (error.type) {
      console.error(`   Type: ${error.type}`);
    }
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  }
}

// Exécuter
configureWebhook()
  .then((result) => {
    console.log('\n🎉 Configuration terminée!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });


#!/usr/bin/env node

/**
 * Script pour configurer automatiquement le webhook Stripe
 * - Crée le webhook endpoint
 * - Configure les événements nécessaires
 * - Récupère le webhook secret
 * - Met à jour les variables d'environnement
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

// Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const BACKEND_URL = process.env.BACKEND_URL || process.env.VERCEL_URL || 'https://api.luneo.app';
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/webhooks/stripe`;

// Événements Stripe à écouter
const WEBHOOK_EVENTS = [
  'checkout.session.completed',      // Paiement réussi (abonnements + crédits)
  'payment_intent.succeeded',         // Paiement réussi
  'payment_intent.payment_failed',    // Échec paiement
  'customer.subscription.created',    // Abonnement créé
  'customer.subscription.updated',    // Abonnement modifié
  'customer.subscription.deleted',    // Abonnement annulé
  'invoice.payment_succeeded',       // Facture payée
  'invoice.payment_failed',          // Échec facture
];

async function configureWebhook() {
  if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY non trouvée dans .env.production');
    process.exit(1);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  console.log('🔧 Configuration du webhook Stripe...\n');
  console.log(`📍 Endpoint: ${WEBHOOK_ENDPOINT}\n`);

  try {
    // 1. Lister les webhooks existants
    console.log('📋 Recherche des webhooks existants...');
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    // Chercher un webhook existant pour cet endpoint
    let webhook = existingWebhooks.data.find(
      (wh) => wh.url === WEBHOOK_ENDPOINT
    );

    if (webhook) {
      console.log(`✅ Webhook existant trouvé: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Statut: ${webhook.status}`);
      
      // Vérifier si les événements sont corrects
      const currentEvents = webhook.enabled_events || [];
      const missingEvents = WEBHOOK_EVENTS.filter(
        (event) => !currentEvents.includes(event)
      );

      if (missingEvents.length > 0) {
        console.log(`\n⚠️  Événements manquants: ${missingEvents.join(', ')}`);
        console.log('🔄 Mise à jour du webhook...');
        
        webhook = await stripe.webhookEndpoints.update(webhook.id, {
          enabled_events: WEBHOOK_EVENTS,
        });
        
        console.log('✅ Webhook mis à jour avec succès!');
      } else {
        console.log('✅ Tous les événements sont déjà configurés!');
      }
    } else {
      // 2. Créer un nouveau webhook
      console.log('🆕 Création d\'un nouveau webhook...');
      
      webhook = await stripe.webhookEndpoints.create({
        url: WEBHOOK_ENDPOINT,
        enabled_events: WEBHOOK_EVENTS,
        description: 'Luneo Platform - Webhook pour paiements et abonnements',
        api_version: '2025-12-15.clover',
      });

      console.log('✅ Webhook créé avec succès!');
      console.log(`   ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Statut: ${webhook.status}`);
    }

    // 3. Récupérer le webhook secret
    console.log('\n🔐 Récupération du webhook secret...');
    
    // Le secret est dans webhook.secret (pour les nouveaux) ou il faut le récupérer
    let webhookSecret = webhook.secret;
    
    if (!webhookSecret) {
      // Pour les webhooks existants, récupérer le secret depuis les sign secrets
      const signSecrets = await stripe.webhookEndpoints.retrieve(webhook.id);
      // Le secret n'est pas retourné par l'API pour des raisons de sécurité
      // Il faut le récupérer depuis le dashboard ou utiliser le dernier secret connu
      console.log('⚠️  Le secret n\'est pas disponible via l\'API.');
      console.log('   Vous devez le récupérer depuis: https://dashboard.stripe.com/webhooks');
      console.log(`   Webhook ID: ${webhook.id}`);
    } else {
      webhookSecret = webhook.secret;
    }

    // 4. Afficher les informations
    console.log('\n📊 Configuration du webhook:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Webhook ID:     ${webhook.id}`);
    console.log(`URL:            ${webhook.url}`);
    console.log(`Statut:         ${webhook.status}`);
    console.log(`Événements:     ${webhook.enabled_events.length} configurés`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Événements configurés:');
    WEBHOOK_EVENTS.forEach((event) => {
      const isEnabled = webhook.enabled_events.includes(event);
      console.log(`   ${isEnabled ? '✅' : '❌'} ${event}`);
    });

    // 5. Instructions pour récupérer le secret
    console.log('\n🔐 Pour récupérer le Webhook Secret:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Aller sur: https://dashboard.stripe.com/webhooks');
    console.log(`2. Cliquer sur le webhook: ${webhook.id}`);
    console.log('3. Dans "Signing secret", cliquer sur "Reveal"');
    console.log('4. Copier le secret (commence par whsec_...)');
    console.log('5. Ajouter dans Vercel: STRIPE_WEBHOOK_SECRET');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 6. Essayer de mettre à jour .env.production si possible
    const envPath = path.join(__dirname, '../.env.production');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Mettre à jour ou ajouter STRIPE_WEBHOOK_SECRET
      if (webhookSecret) {
        if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
          envContent = envContent.replace(
            /STRIPE_WEBHOOK_SECRET=.*/,
            `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
          );
        } else {
          envContent += `\nSTRIPE_WEBHOOK_SECRET=${webhookSecret}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ STRIPE_WEBHOOK_SECRET ajouté dans .env.production');
      } else {
        console.log('⚠️  STRIPE_WEBHOOK_SECRET non disponible, ajoutez-le manuellement');
      }
    }

    // 7. Générer un script pour Vercel
    const vercelScript = `#!/bin/bash
# Script pour ajouter STRIPE_WEBHOOK_SECRET dans Vercel
# Utilisez: vercel env add STRIPE_WEBHOOK_SECRET production

echo "Pour ajouter le webhook secret dans Vercel:"
echo "1. Exécutez: vercel env add STRIPE_WEBHOOK_SECRET production"
echo "2. Collez le secret (whsec_...)"
echo ""
echo "Ou via le dashboard Vercel:"
echo "1. Allez dans Settings > Environment Variables"
echo "2. Ajoutez STRIPE_WEBHOOK_SECRET"
echo "3. Valeur: (récupérez depuis https://dashboard.stripe.com/webhooks)"
`;

    const scriptPath = path.join(__dirname, '../scripts/add-webhook-secret-to-vercel.sh');
    fs.writeFileSync(scriptPath, vercelScript);
    fs.chmodSync(scriptPath, '755');
    console.log(`✅ Script Vercel créé: ${scriptPath}\n`);

    console.log('✅ Configuration terminée avec succès!\n');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Récupérer le webhook secret depuis le dashboard Stripe');
    console.log('   2. L\'ajouter dans Vercel (Settings > Environment Variables)');
    console.log('   3. Tester le webhook avec: stripe listen --forward-to ' + WEBHOOK_ENDPOINT);

    return {
      webhookId: webhook.id,
      webhookUrl: webhook.url,
      webhookSecret: webhookSecret || 'À récupérer depuis le dashboard',
      events: webhook.enabled_events,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du webhook:', error.message);
    if (error.type) {
      console.error(`   Type: ${error.type}`);
    }
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  }
}

// Exécuter
configureWebhook()
  .then((result) => {
    console.log('\n🎉 Configuration terminée!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
















