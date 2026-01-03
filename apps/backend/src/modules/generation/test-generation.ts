/**
 * Script de test pour le module Generation
 * Usage: npx ts-node src/modules/generation/test-generation.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGenerationModule() {
  console.log('🧪 Test du module Generation\n');

  try {
    // 1. Vérifier qu'il y a au moins un Brand
    console.log('1️⃣ Vérification des données de base...');
    const brands = await prisma.brand.findMany({ take: 1 });
    
    if (brands.length === 0) {
      console.log('❌ Aucun Brand trouvé. Créons-en un pour le test...');
      const testBrand = await prisma.brand.create({
        data: {
          name: 'Test Brand',
          slug: 'test-brand',
          subscriptionPlan: 'STARTER',
          subscriptionStatus: 'ACTIVE',
          maxMonthlyGenerations: 100,
          monthlyGenerations: 0,
        },
      });
      console.log('✅ Brand créé:', testBrand.id);
    } else {
      console.log('✅ Brand trouvé:', brands[0].id);
    }

    const brandId = brands[0]?.id || (await prisma.brand.findFirst())?.id;
    if (!brandId) {
      throw new Error('Impossible de trouver ou créer un Brand');
    }

    // 2. Vérifier qu'il y a au moins un Product
    console.log('\n2️⃣ Vérification des produits...');
    let product = await prisma.product.findFirst({
      where: { brandId },
    });

    if (!product) {
      console.log('❌ Aucun Product trouvé. Créons-en un pour le test...');
      product = await prisma.product.create({
        data: {
          brandId,
          name: 'Test Product',
          slug: 'test-product',
          description: 'Product de test pour génération IA',
          price: 0,
          status: 'ACTIVE',
          aiProvider: 'openai',
          generationQuality: 'standard',
          outputFormat: 'png',
          outputWidth: 1024,
          outputHeight: 1024,
          arEnabled: true,
          arTrackingType: 'surface',
        },
      });
      console.log('✅ Product créé:', product.id);
    } else {
      console.log('✅ Product trouvé:', product.id);
    }

    // 3. Vérifier les CustomizationZones
    console.log('\n3️⃣ Vérification des zones de personnalisation...');
    let zones = await prisma.customizationZone.findMany({
      where: { productId: product.id },
    });

    if (zones.length === 0) {
      console.log('❌ Aucune zone trouvée. Créons-en une...');
      const zone = await prisma.customizationZone.create({
        data: {
          productId: product.id,
          name: 'Zone 1',
          type: 'TEXT',
          positionX: 0.5,
          positionY: 0.5,
          width: 200,
          height: 100,
          required: false,
        },
      });
      zones = [zone];
      console.log('✅ Zone créée:', zone.id);
    } else {
      console.log(`✅ ${zones.length} zone(s) trouvée(s)`);
    }

    // 4. Test de création d'une génération
    console.log('\n4️⃣ Test de création d\'une génération...');
    const customizations = zones.reduce((acc, zone) => {
      if (zone.type === 'TEXT') {
        acc[zone.id] = {
          text: 'Hello World',
          font: 'Arial',
          color: '#000000',
        };
      }
      return acc;
    }, {} as Record<string, any>);

    const generation = await prisma.generation.create({
      data: {
        publicId: `test_${Date.now()}`,
        brandId,
        productId: product.id,
        customizations: customizations as any,
        userPrompt: 'Make it elegant',
        finalPrompt: 'A photorealistic image of a Test Product with the text "Hello World" printed in Arial font with #000000 color',
        negativePrompt: 'blurry, low quality',
        aiProvider: product.aiProvider,
        model: 'dall-e-3',
        quality: product.generationQuality,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    console.log('✅ Génération créée:', generation.publicId);
    console.log('   - ID:', generation.id);
    console.log('   - Status:', generation.status);
    console.log('   - Provider:', generation.aiProvider);

    // 5. Vérifier que la génération est bien enregistrée
    console.log('\n5️⃣ Vérification de la génération...');
    const foundGeneration = await prisma.generation.findUnique({
      where: { id: generation.id },
      include: {
        product: {
          select: { name: true, slug: true },
        },
      },
    });

    if (foundGeneration) {
      console.log('✅ Génération trouvée dans la base');
      console.log('   - Product:', foundGeneration.product.name);
      console.log('   - Customizations:', JSON.stringify(foundGeneration.customizations, null, 2));
    } else {
      throw new Error('Génération non trouvée après création');
    }

    // 6. Test de mise à jour du statut
    console.log('\n6️⃣ Test de mise à jour du statut...');
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: 'PROCESSING',
      },
    });

    const updatedGeneration = await prisma.generation.findUnique({
      where: { id: generation.id },
    });

    if (updatedGeneration?.status === 'PROCESSING') {
      console.log('✅ Statut mis à jour avec succès');
    } else {
      throw new Error('Échec de la mise à jour du statut');
    }

    // 7. Test de compteur de générations
    console.log('\n7️⃣ Test du compteur de générations...');
    const brandBefore = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { monthlyGenerations: true },
    });

    await prisma.brand.update({
      where: { id: brandId },
      data: {
        monthlyGenerations: { increment: 1 },
      },
    });

    const brandAfter = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { monthlyGenerations: true },
    });

    if (brandAfter && brandBefore && brandAfter.monthlyGenerations === brandBefore.monthlyGenerations + 1) {
      console.log('✅ Compteur de générations incrémenté');
      console.log(`   - Avant: ${brandBefore.monthlyGenerations}`);
      console.log(`   - Après: ${brandAfter.monthlyGenerations}`);
    } else {
      throw new Error('Échec de l\'incrémentation du compteur');
    }

    console.log('\n✅ Tous les tests du module Generation sont passés !');
    console.log('\n📝 Résumé:');
    console.log(`   - Brand ID: ${brandId}`);
    console.log(`   - Product ID: ${product.id}`);
    console.log(`   - Generation ID: ${generation.id}`);
    console.log(`   - Generation Public ID: ${generation.publicId}`);

    // Nettoyage optionnel
    console.log('\n🧹 Nettoyage...');
    await prisma.generation.delete({
      where: { id: generation.id },
    });
    console.log('✅ Génération de test supprimée');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testGenerationModule()
  .then(() => {
    console.log('\n🎉 Tests terminés avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

