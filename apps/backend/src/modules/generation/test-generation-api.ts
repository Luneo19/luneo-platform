/**
 * Script de test pour l'API Generation
 * Usage: npx ts-node src/modules/generation/test-generation-api.ts
 * 
 * Prérequis:
 * - Le serveur backend doit être démarré (npm run start:dev)
 * - Une API Key valide doit exister dans la base de données
 */

import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new Logger('TestGenerationAPI');
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function testGenerationAPI() {
  logger.log('🧪 Test de l\'API Generation\n');
  logger.log(`📍 API URL: ${API_BASE_URL}\n`);

  try {
    // 1. Récupérer un Brand et créer une API Key de test
    logger.log('1️⃣ Préparation des données de test...');
    const brand = await prisma.brand.findFirst();
    if (!brand) {
      throw new Error('Aucun Brand trouvé dans la base de données');
    }
    logger.log('✅ Brand trouvé:', brand.id);

    // Vérifier ou créer une API Key
    let apiKey = await prisma.apiKey.findFirst({
      where: { brandId: brand.id, isActive: true },
    });

    if (!apiKey) {
      // Créer une API Key de test
      const keyValue = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      apiKey = await prisma.apiKey.create({
        data: {
          brandId: brand.id,
          name: 'Test API Key',
          key: keyValue, // Le champ 'key' est requis et unique
          permissions: ['generation:create', 'generation:read'],
          rateLimit: { requestsPerMinute: 100, requestsPerDay: 10000, requestsPerMonth: 100000 }, // JSON
          isActive: true,
        },
      });
      logger.log('✅ API Key créée:', apiKey.id);
      logger.log(`   ⚠️  Key value: ${keyValue} (à utiliser pour les tests)`);
    } else {
      logger.log('✅ API Key trouvée:', apiKey.id);
    }

    // 2. Récupérer un Product
    const product = await prisma.product.findFirst({
      where: { brandId: brand.id },
      include: { customizationZones: true },
    });

    if (!product) {
      throw new Error('Aucun Product trouvé');
    }
    logger.log('✅ Product trouvé:', product.id);

    // 3. Préparer les customizations
    const customizations = product.customizationZones.reduce((acc, zone) => {
      if (zone.type === 'TEXT') {
        acc[zone.id] = {
          text: 'Test Generation',
          font: 'Arial',
          color: '#FF0000',
        };
      } else if (zone.type === 'COLOR') {
        acc[zone.id] = {
          color: '#0000FF',
        };
      }
      return acc;
    }, {} as Record<string, any>);

    if (Object.keys(customizations).length === 0) {
      logger.log('⚠️  Aucune zone de personnalisation trouvée, création d\'une zone de test...');
      const zone = await prisma.customizationZone.create({
        data: {
          productId: product.id,
          name: 'Test Zone',
          type: 'TEXT',
          positionX: 0.5,
          positionY: 0.5,
          width: 200,
          height: 100,
        },
      });
      customizations[zone.id] = {
        text: 'Test Generation',
        font: 'Arial',
        color: '#FF0000',
      };
    }

    // 4. Test de création d'une génération via API
    logger.log('\n2️⃣ Test POST /generation/create...');
    const createResponse = await fetch(`${API_BASE_URL}/generation/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey.id, // Utiliser l'ID de l'API Key (le service valide par ID)
      },
      body: JSON.stringify({
        productId: product.id,
        customizations,
        userPrompt: 'Make it elegant and modern',
        sessionId: `test_session_${Date.now()}`,
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`API Error: ${createResponse.status} - ${errorText}`);
    }

    const createResult = await createResponse.json() as ApiResponse<{
      id: string;
      status: string;
      estimatedTime?: number;
      statusUrl: string;
    }>;

    if (!createResult.data) {
      throw new Error('Réponse API invalide: ' + JSON.stringify(createResult));
    }

    logger.log('✅ Génération créée via API');
    logger.log('   - Public ID:', createResult.data.id);
    logger.log('   - Status:', createResult.data.status);
    logger.log('   - Estimated Time:', createResult.data.estimatedTime, 's');

    const generationPublicId = createResult.data.id;

    // 5. Test de récupération du statut
    logger.log('\n3️⃣ Test GET /generation/:publicId/status...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s

    const statusResponse = await fetch(`${API_BASE_URL}/generation/${generationPublicId}/status`);
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`API Error: ${statusResponse.status} - ${errorText}`);
    }

    const statusResult = await statusResponse.json() as ApiResponse<{
      status: string;
      progress?: number;
      result?: any;
      error?: string;
    }>;

    logger.log('✅ Statut récupéré');
    logger.log('   - Status:', statusResult.data?.status);
    if (statusResult.data?.progress) {
      logger.log('   - Progress:', statusResult.data.progress, '%');
    }

    // 6. Test de récupération complète
    logger.log('\n4️⃣ Test GET /generation/:publicId...');
    const getResponse = await fetch(`${API_BASE_URL}/generation/${generationPublicId}`);
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`API Error: ${getResponse.status} - ${errorText}`);
    }

    const getResult = await getResponse.json() as ApiResponse<{
      id: string;
      status: string;
      product: any;
      customizations: any;
      result?: any;
    }>;

    logger.log('✅ Génération complète récupérée');
    logger.log('   - ID:', getResult.data?.id);
    logger.log('   - Status:', getResult.data?.status);
    logger.log('   - Product:', getResult.data?.product?.name);

    logger.log('\n✅ Tous les tests de l\'API Generation sont passés !');
    logger.log('\n📝 Résumé:');
    logger.log(`   - Brand ID: ${brand.id}`);
    logger.log(`   - Product ID: ${product.id}`);
    logger.log(`   - Generation Public ID: ${generationPublicId}`);
    logger.log(`   - API Key ID: ${apiKey.id}`);

  } catch (error: any) {
    logger.error('\n❌ Erreur lors des tests API:', error.message);
    if (error.stack) {
      logger.error('Stack:', error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier que le serveur est accessible
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Exécuter les tests
checkServer()
  .then((isUp) => {
    if (!isUp) {
      logger.error(`❌ Le serveur backend n'est pas accessible à ${API_BASE_URL}`);
      logger.error('   Veuillez démarrer le serveur avec: npm run start:dev');
      process.exit(1);
    }
    return testGenerationAPI();
  })
  .then(() => {
    logger.log('\n🎉 Tests API terminés avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

