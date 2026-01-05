/**
 * Seed script pour les packs de crédits IA
 * À exécuter après création des Stripe Products
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding credit packs...');

  // Vérifier si packs existent déjà
  const existing = await prisma.creditPack.findMany();
  if (existing.length > 0) {
    console.log('✅ Credit packs already exist, skipping seed.');
    return;
  }

  // Créer les packs
  const packs = [
    {
      id: 'pack_100',
      name: 'Pack 100',
      credits: 100,
      priceCents: 1900, // 19€
      stripePriceId: process.env.STRIPE_PRICE_CREDITS_100 || null,
      isActive: true,
      isFeatured: false,
      savings: 0,
      badge: null,
    },
    {
      id: 'pack_500',
      name: 'Pack 500',
      credits: 500,
      priceCents: 7900, // 79€
      stripePriceId: process.env.STRIPE_PRICE_CREDITS_500 || null,
      isActive: true,
      isFeatured: true,
      savings: 16, // 16% économie vs pack 100
      badge: 'Best Value',
    },
    {
      id: 'pack_1000',
      name: 'Pack 1000',
      credits: 1000,
      priceCents: 13900, // 139€
      stripePriceId: process.env.STRIPE_PRICE_CREDITS_1000 || null,
      isActive: true,
      isFeatured: false,
      savings: 26, // 26% économie vs pack 100
      badge: null,
    },
  ];

  for (const pack of packs) {
    await prisma.creditPack.upsert({
      where: { id: pack.id },
      update: pack,
      create: pack,
    });
    console.log(`✅ Created/Updated pack: ${pack.name}`);
  }

  console.log('🎉 Credit packs seeded successfully!');
  console.log('\n⚠️  Remember to update stripePriceId after creating Stripe Products:');
  console.log('   UPDATE "CreditPack" SET "stripePriceId" = \'price_xxx\' WHERE id = \'pack_100\';');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding credit packs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






/**
 * Seed script pour les packs de crédits IA
 * À exécuter après création des Stripe Products
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding credit packs...');

  // Vérifier si packs existent déjà
  const existing = await prisma.creditPack.findMany();
  if (existing.length > 0) {
    console.log('✅ Credit packs already exist, skipping seed.');
    return;
  }

  // Créer les packs
  const packs = [
    {
      id: 'pack_100',
      name: 'Pack 100',
      credits: 100,
      priceCents: 1900, // 19€
      stripePriceId: process.env.STRIPE_PRICE_CREDITS_100 || null,
      isActive: true,
      isFeatured: false,
      savings: 0,
      badge: null,
    },
    {
      id: 'pack_500',
      name: 'Pack 500',
      credits: 500,
      priceCents: 7900, // 79€
      stripePriceId: process.env.STRIPE_PRICE_CREDITS_500 || null,
      isActive: true,
      isFeatured: true,
      savings: 16, // 16% économie vs pack 100
      badge: 'Best Value',
    },
    {
      id: 'pack_1000',
      name: 'Pack 1000',
      credits: 1000,
      priceCents: 13900, // 139€
      stripePriceId: process.env.STRIPE_PRICE_CREDITS_1000 || null,
      isActive: true,
      isFeatured: false,
      savings: 26, // 26% économie vs pack 100
      badge: null,
    },
  ];

  for (const pack of packs) {
    await prisma.creditPack.upsert({
      where: { id: pack.id },
      update: pack,
      create: pack,
    });
    console.log(`✅ Created/Updated pack: ${pack.name}`);
  }

  console.log('🎉 Credit packs seeded successfully!');
  console.log('\n⚠️  Remember to update stripePriceId after creating Stripe Products:');
  console.log('   UPDATE "CreditPack" SET "stripePriceId" = \'price_xxx\' WHERE id = \'pack_100\';');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding credit packs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





























