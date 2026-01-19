import { PrismaClient, UserRole, BrandStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Ensure critical columns exist (in case migrations were marked as applied but not executed)
  try {
    await prisma.$executeRawUnsafe(`
      -- 2FA columns on User
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_2fa_enabled" BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "two_fa_secret" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "temp_2fa_secret" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];
      
      -- Product columns (used by CacheWarmingService)
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "negativePrompt" TEXT;
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "aiProvider" TEXT NOT NULL DEFAULT 'openai';
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arEnabled" BOOLEAN NOT NULL DEFAULT true;
      
      -- Brand columns (used by CacheWarmingService)
      ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
      ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "maxMonthlyGenerations" INTEGER NOT NULL DEFAULT 100;
      ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "maxProducts" INTEGER NOT NULL DEFAULT 5;
      ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "arEnabled" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✅ Critical columns verified/created');
  } catch (error: any) {
    // Non-critical - columns may already exist or migration already applied
    console.log('ℹ️ Column verification (non-critical):', error.message?.substring(0, 100));
  }

  // Create platform admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@luneo.com' },
    update: {},
    create: {
      email: 'admin@luneo.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Luneo',
      role: UserRole.PLATFORM_ADMIN,
      emailVerified: true,
      userQuota: {
        create: {
          monthlyLimit: 1000,
          costLimitCents: 50000, // 500€
        },
      },
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample brand
  const sampleBrand = await prisma.brand.upsert({
    where: { slug: 'sample-brand' },
    update: {},
    create: {
      name: 'Sample Brand',
      slug: 'sample-brand',
      description: 'A sample brand for testing',
      status: BrandStatus.VERIFIED,
      companyName: 'Sample Brand Ltd',
      address: '123 Sample Street',
      city: 'Paris',
      country: 'France',
      postalCode: '75001',
      phone: '+33123456789',
      plan: 'premium',
    },
  });

  console.log('✅ Sample brand created:', sampleBrand.name);

  // Create brand admin user
  const brandAdminPassword = await bcrypt.hash('brand123', 12);
  const brandAdmin = await prisma.user.upsert({
    where: { email: 'brand@luneo.com' },
    update: {},
    create: {
      email: 'brand@luneo.com',
      password: brandAdminPassword,
      firstName: 'Brand',
      lastName: 'Admin',
      role: UserRole.BRAND_ADMIN,
      emailVerified: true,
      brandId: sampleBrand.id,
      userQuota: {
        create: {
          monthlyLimit: 500,
          costLimitCents: 25000, // 250€
        },
      },
    },
  });

  console.log('✅ Brand admin user created:', brandAdmin.email);

  // Create sample product
  const sampleProduct = await prisma.product.upsert({
    where: { id: 'sample-product-1' },
    update: {},
    create: {
      id: 'sample-product-1',
      name: 'T-Shirt Personnalisé',
      slug: 't-shirt-personnalise',
      description: 'T-shirt en coton bio personnalisable',
      sku: 'TSH-001',
      price: 29.99,
      currency: 'EUR',
      images: [
        'https://example.com/tshirt-white.jpg',
        'https://example.com/tshirt-black.jpg',
      ],
      model3dUrl: 'https://example.com/tshirt-3d.glb',
      modelConfig: {
        scale: 1.0,
        rotation: [0, 0, 0],
        position: [0, 0, 0],
      },
      customizationOptions: {
        colors: ['white', 'black', 'blue', 'red'],
        sizes: ['S', 'M', 'L', 'XL'],
        materials: ['cotton', 'polyester'],
      },
      brandId: sampleBrand.id,
      isActive: true,
      isPublic: true,
    },
  });

  console.log('✅ Sample product created:', sampleProduct.name);

  // Create sample design
  const sampleDesign = await prisma.design.upsert({
    where: { id: 'sample-design-1' },
    update: {},
    create: {
      id: 'sample-design-1',
      name: 'Design Floral',
      description: 'Design floral élégant',
      prompt: 'A beautiful floral pattern with roses and leaves',
      options: {
        style: 'realistic',
        colors: ['pink', 'green'],
        resolution: '1024x1024',
      },
      status: 'COMPLETED',
      previewUrl: 'https://example.com/design-preview.jpg',
      highResUrl: 'https://example.com/design-highres.jpg',
      costCents: 50,
      provider: 'openai',
      metadata: {
        model: 'dall-e-3',
        duration: 5000,
        tokens: 100,
      },
      userId: brandAdmin.id,
      brandId: sampleBrand.id,
      productId: sampleProduct.id,
      completedAt: new Date(),
    },
  });

  console.log('✅ Sample design created:', sampleDesign.name);

  // Create sample order
  const sampleOrder = await prisma.order.upsert({
    where: { id: 'sample-order-1' },
    update: {},
    create: {
      id: 'sample-order-1',
      orderNumber: 'ORD-20241219-001',
      status: 'PAID',
      customerEmail: 'customer@example.com',
      customerName: 'John Doe',
      customerPhone: '+33123456789',
      shippingAddress: {
        street: '456 Customer Street',
        city: 'Lyon',
        country: 'France',
        postalCode: '69001',
      },
      subtotalCents: 2999,
      taxCents: 600,
      shippingCents: 0,
      totalCents: 3599,
      currency: 'EUR',
      paymentStatus: 'SUCCEEDED',
      stripePaymentId: 'pi_sample_123',
      userId: brandAdmin.id,
      brandId: sampleBrand.id,
      designId: sampleDesign.id,
      productId: sampleProduct.id,
      paidAt: new Date(),
    },
  });

  console.log('✅ Sample order created:', sampleOrder.orderNumber);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
