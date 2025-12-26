#!/usr/bin/env node

/**
 * Script pour récupérer le webhook secret et l'ajouter automatiquement dans Vercel
 */

const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_ID = 'we_1SgixRKG9MsM6fdSbBmG84sR'; // ID du webhook créé

async function getWebhookSecret() {
  if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY non trouvée');
    process.exit(1);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  try {
    console.log('🔍 Récupération du webhook secret...\n');
    
    // Récupérer le webhook
    const webhook = await stripe.webhookEndpoints.retrieve(WEBHOOK_ID);
    
    console.log(`✅ Webhook trouvé: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Statut: ${webhook.status}\n`);

    // Le secret n'est pas disponible via l'API pour des raisons de sécurité
    // Il faut le récupérer depuis le dashboard ou utiliser le secret de création
    console.log('⚠️  Le secret n\'est pas disponible via l\'API Stripe.');
    console.log('   Stripe ne retourne pas le secret pour des raisons de sécurité.\n');
    
    // Essayer de récupérer depuis les sign secrets (nécessite une clé API avec permissions)
    try {
      // Utiliser l'API pour récupérer le secret (nécessite des permissions spéciales)
      const response = await fetch(`https://api.stripe.com/v1/webhook_endpoints/${WEBHOOK_ID}`, {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });
      
      const data = await response.json();
      
      if (data.secret) {
        return data.secret;
      }
    } catch (error) {
      console.log('   Tentative de récupération via API directe échouée (normal).\n');
    }

    // Alternative: Utiliser Stripe CLI pour récupérer le secret
    console.log('💡 Solution: Utiliser Stripe CLI pour récupérer le secret\n');
    console.log('   Exécutez: stripe webhooks retrieve ' + WEBHOOK_ID);
    console.log('   Ou allez sur: https://dashboard.stripe.com/webhooks/' + WEBHOOK_ID);
    console.log('   Cliquez sur "Reveal" dans "Signing secret"\n');

    // Générer un script pour récupérer le secret via Stripe CLI
    const cliScript = `#!/bin/bash
# Script pour récupérer le webhook secret via Stripe CLI

echo "🔍 Récupération du webhook secret via Stripe CLI..."
echo ""

# Vérifier si Stripe CLI est installé
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI n'est pas installé"
    echo "   Installez-le: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Récupérer le webhook
WEBHOOK_INFO=$(stripe webhooks retrieve ${WEBHOOK_ID} 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Webhook récupéré:"
    echo "$WEBHOOK_INFO" | grep -A 5 "Signing secret"
    echo ""
    echo "📋 Pour ajouter dans Vercel:"
    echo "   vercel env add STRIPE_WEBHOOK_SECRET production"
else
    echo "❌ Erreur lors de la récupération"
    echo "$WEBHOOK_INFO"
    exit 1
fi
`;

    const cliScriptPath = path.join(__dirname, '../scripts/get-webhook-secret-cli.sh');
    fs.writeFileSync(cliScriptPath, cliScript);
    fs.chmodSync(cliScriptPath, '755');
    console.log(`✅ Script CLI créé: ${cliScriptPath}\n`);

    // Essayer d'utiliser l'API Vercel pour ajouter la variable
    // (nécessite VERCEL_TOKEN ou être connecté via CLI)
    console.log('🔧 Tentative d\'ajout automatique dans Vercel...\n');
    
    try {
      // Vérifier si on est connecté à Vercel
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Connecté à Vercel\n');
      
      // Demander le secret à l'utilisateur
      console.log('📝 Pour ajouter automatiquement dans Vercel:');
      console.log('   1. Récupérez le secret depuis: https://dashboard.stripe.com/webhooks/' + WEBHOOK_ID);
      console.log('   2. Exécutez: vercel env add STRIPE_WEBHOOK_SECRET production');
      console.log('   3. Collez le secret (whsec_...)\n');
      
    } catch (error) {
      console.log('⚠️  Non connecté à Vercel CLI');
      console.log('   Connectez-vous: vercel login\n');
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Fonction pour ajouter automatiquement dans Vercel si le secret est disponible
async function addToVercel(secret) {
  if (!secret) {
    console.log('⚠️  Secret non disponible, ajout manuel requis\n');
    return;
  }

  try {
    console.log('🚀 Ajout dans Vercel...\n');
    
    // Utiliser Vercel CLI pour ajouter la variable
    const command = `echo "${secret}" | vercel env add STRIPE_WEBHOOK_SECRET production`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ Variable ajoutée dans Vercel avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout dans Vercel:', error.message);
    console.log('\n📝 Ajout manuel:');
    console.log('   vercel env add STRIPE_WEBHOOK_SECRET production');
    console.log(`   Valeur: ${secret}\n`);
  }
}

// Exécuter
getWebhookSecret()
  .then((secret) => {
    if (secret) {
      console.log(`\n🔐 Secret récupéré: ${secret.substring(0, 20)}...\n`);
      return addToVercel(secret);
    } else {
      console.log('\n📋 Instructions pour récupérer le secret:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Allez sur: https://dashboard.stripe.com/webhooks/' + WEBHOOK_ID);
      console.log('2. Cliquez sur "Reveal" dans la section "Signing secret"');
      console.log('3. Copiez le secret (commence par whsec_...)');
      console.log('4. Ajoutez dans Vercel: vercel env add STRIPE_WEBHOOK_SECRET production');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });


#!/usr/bin/env node

/**
 * Script pour récupérer le webhook secret et l'ajouter automatiquement dans Vercel
 */

const Stripe = require('stripe');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_ID = 'we_1SgixRKG9MsM6fdSbBmG84sR'; // ID du webhook créé

async function getWebhookSecret() {
  if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY non trouvée');
    process.exit(1);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  try {
    console.log('🔍 Récupération du webhook secret...\n');
    
    // Récupérer le webhook
    const webhook = await stripe.webhookEndpoints.retrieve(WEBHOOK_ID);
    
    console.log(`✅ Webhook trouvé: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Statut: ${webhook.status}\n`);

    // Le secret n'est pas disponible via l'API pour des raisons de sécurité
    // Il faut le récupérer depuis le dashboard ou utiliser le secret de création
    console.log('⚠️  Le secret n\'est pas disponible via l\'API Stripe.');
    console.log('   Stripe ne retourne pas le secret pour des raisons de sécurité.\n');
    
    // Essayer de récupérer depuis les sign secrets (nécessite une clé API avec permissions)
    try {
      // Utiliser l'API pour récupérer le secret (nécessite des permissions spéciales)
      const response = await fetch(`https://api.stripe.com/v1/webhook_endpoints/${WEBHOOK_ID}`, {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });
      
      const data = await response.json();
      
      if (data.secret) {
        return data.secret;
      }
    } catch (error) {
      console.log('   Tentative de récupération via API directe échouée (normal).\n');
    }

    // Alternative: Utiliser Stripe CLI pour récupérer le secret
    console.log('💡 Solution: Utiliser Stripe CLI pour récupérer le secret\n');
    console.log('   Exécutez: stripe webhooks retrieve ' + WEBHOOK_ID);
    console.log('   Ou allez sur: https://dashboard.stripe.com/webhooks/' + WEBHOOK_ID);
    console.log('   Cliquez sur "Reveal" dans "Signing secret"\n');

    // Générer un script pour récupérer le secret via Stripe CLI
    const cliScript = `#!/bin/bash
# Script pour récupérer le webhook secret via Stripe CLI

echo "🔍 Récupération du webhook secret via Stripe CLI..."
echo ""

# Vérifier si Stripe CLI est installé
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI n'est pas installé"
    echo "   Installez-le: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Récupérer le webhook
WEBHOOK_INFO=$(stripe webhooks retrieve ${WEBHOOK_ID} 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Webhook récupéré:"
    echo "$WEBHOOK_INFO" | grep -A 5 "Signing secret"
    echo ""
    echo "📋 Pour ajouter dans Vercel:"
    echo "   vercel env add STRIPE_WEBHOOK_SECRET production"
else
    echo "❌ Erreur lors de la récupération"
    echo "$WEBHOOK_INFO"
    exit 1
fi
`;

    const cliScriptPath = path.join(__dirname, '../scripts/get-webhook-secret-cli.sh');
    fs.writeFileSync(cliScriptPath, cliScript);
    fs.chmodSync(cliScriptPath, '755');
    console.log(`✅ Script CLI créé: ${cliScriptPath}\n`);

    // Essayer d'utiliser l'API Vercel pour ajouter la variable
    // (nécessite VERCEL_TOKEN ou être connecté via CLI)
    console.log('🔧 Tentative d\'ajout automatique dans Vercel...\n');
    
    try {
      // Vérifier si on est connecté à Vercel
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Connecté à Vercel\n');
      
      // Demander le secret à l'utilisateur
      console.log('📝 Pour ajouter automatiquement dans Vercel:');
      console.log('   1. Récupérez le secret depuis: https://dashboard.stripe.com/webhooks/' + WEBHOOK_ID);
      console.log('   2. Exécutez: vercel env add STRIPE_WEBHOOK_SECRET production');
      console.log('   3. Collez le secret (whsec_...)\n');
      
    } catch (error) {
      console.log('⚠️  Non connecté à Vercel CLI');
      console.log('   Connectez-vous: vercel login\n');
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Fonction pour ajouter automatiquement dans Vercel si le secret est disponible
async function addToVercel(secret) {
  if (!secret) {
    console.log('⚠️  Secret non disponible, ajout manuel requis\n');
    return;
  }

  try {
    console.log('🚀 Ajout dans Vercel...\n');
    
    // Utiliser Vercel CLI pour ajouter la variable
    const command = `echo "${secret}" | vercel env add STRIPE_WEBHOOK_SECRET production`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ Variable ajoutée dans Vercel avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout dans Vercel:', error.message);
    console.log('\n📝 Ajout manuel:');
    console.log('   vercel env add STRIPE_WEBHOOK_SECRET production');
    console.log(`   Valeur: ${secret}\n`);
  }
}

// Exécuter
getWebhookSecret()
  .then((secret) => {
    if (secret) {
      console.log(`\n🔐 Secret récupéré: ${secret.substring(0, 20)}...\n`);
      return addToVercel(secret);
    } else {
      console.log('\n📋 Instructions pour récupérer le secret:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Allez sur: https://dashboard.stripe.com/webhooks/' + WEBHOOK_ID);
      console.log('2. Cliquez sur "Reveal" dans la section "Signing secret"');
      console.log('3. Copiez le secret (commence par whsec_...)');
      console.log('4. Ajoutez dans Vercel: vercel env add STRIPE_WEBHOOK_SECRET production');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
















