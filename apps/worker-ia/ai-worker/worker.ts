#!/usr/bin/env tsx

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  🤖 AI WORKER - LUNEO ENTERPRISE                                  ║
 * ║     Worker pour la génération d'images avec IA                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import OpenAI from 'openai';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { EventEmitter } from 'events';

// Types
interface DesignGenerationJob {
  designId: string;
  prompt: string;
  productId: string;
  brandId: string;
  options: {
    font?: string;
    position?: string;
    material?: string;
    finish?: string;
    depth?: number;
  };
  previewMode?: boolean;
  userId?: string;
}

interface AIGenerationResult {
  previewUrl?: string;
  highResUrl?: string;
  costCents: number;
  metadata: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    processingTimeMs: number;
    provider: string;
  };
}

// Configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();
const eventEmitter = new EventEmitter();

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration du Worker
const worker = new Worker(
  'design-generation',
  async (job: Job<DesignGenerationJob>) => {
    const startTime = Date.now();
    const { designId, prompt, productId, brandId, options, previewMode, userId } = job.data;

    console.log(`🎨 Processing design ${designId} for product ${productId}`);

    try {
      // 1. Mettre à jour le statut
      await prisma.design.update({
        where: { id: designId },
        data: { status: 'PROCESSING' },
      });

      // 2. Récupérer les informations du produit
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { brand: true },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // 3. Valider et nettoyer le prompt
      const cleanedPrompt = await validateAndCleanPrompt(prompt, brandId);
      
      // 4. Générer l'image avec IA
      const aiResult = await generateImageWithAI({
        prompt: cleanedPrompt,
        product: product,
        options: options,
        previewMode: previewMode || false,
      });

      // 5. Traitement post-génération
      const processedImages = await processGeneratedImages(aiResult, product, options);

      // 6. Sauvegarder les résultats
      await prisma.design.update({
        where: { id: designId },
        data: {
          status: 'COMPLETED',
          previewUrl: processedImages.previewUrl,
          highResUrl: processedImages.highResUrl,
          costCents: aiResult.costCents,
          metadata: aiResult.metadata,
          completedAt: new Date(),
        },
      });

      // 7. Enregistrer le coût IA
      await recordAICost(brandId, aiResult.costCents, designId);

      // 8. Émettre l'événement de completion
      eventEmitter.emit('design.completed', {
        designId,
        brandId,
        userId,
        previewUrl: processedImages.previewUrl,
        highResUrl: processedImages.highResUrl,
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ Design ${designId} completed in ${processingTime}ms`);

      return {
        success: true,
        designId,
        previewUrl: processedImages.previewUrl,
        highResUrl: processedImages.highResUrl,
        costCents: aiResult.costCents,
        processingTimeMs: processingTime,
      };

    } catch (error) {
      console.error(`❌ Error processing design ${designId}:`, error);

      // Mettre à jour le statut d'erreur
      await prisma.design.update({
        where: { id: designId },
        data: {
          status: 'FAILED',
          metadata: {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Émettre l'événement d'erreur
      eventEmitter.emit('design.failed', {
        designId,
        brandId,
        userId,
        error: error.message,
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3, // Traiter 3 designs en parallèle
    removeOnComplete: 100,
    removeOnFail: 50,
  }
);

/**
 * Validation et nettoyage du prompt
 */
async function validateAndCleanPrompt(prompt: string, brandId: string): Promise<string> {
  // 1. Vérification de la longueur
  if (prompt.length < 10) {
    throw new Error('Prompt trop court (minimum 10 caractères)');
  }
  if (prompt.length > 1000) {
    throw new Error('Prompt trop long (maximum 1000 caractères)');
  }

  // 2. Modération OpenAI
  const moderation = await openai.moderations.create({
    input: prompt,
  });

  if (moderation.results[0].flagged) {
    throw new Error('Prompt rejeté par la modération automatique');
  }

  // 3. Nettoyage du prompt
  const cleanedPrompt = prompt
    .trim()
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .replace(/[^\w\s\-.,!?()]/g, '') // Supprimer caractères spéciaux
    .substring(0, 1000); // Limiter la longueur

  // 4. Vérification contre la blacklist
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { settings: true },
  });

  const blacklist = brand?.settings?.blacklist || [];
  const hasBlacklistedWords = blacklist.some((word: string) =>
    cleanedPrompt.toLowerCase().includes(word.toLowerCase())
  );

  if (hasBlacklistedWords) {
    throw new Error('Prompt contient des mots interdits');
  }

  return cleanedPrompt;
}

/**
 * Génération d'image avec IA
 */
async function generateImageWithAI(params: {
  prompt: string;
  product: any;
  options: any;
  previewMode: boolean;
}): Promise<AIGenerationResult> {
  const { prompt, product, options, previewMode } = params;
  const startTime = Date.now();

  try {
    // Construire le prompt optimisé
    const optimizedPrompt = buildOptimizedPrompt(prompt, product, options);

    // Configuration de génération
    const generationOptions = {
      model: previewMode ? 'dall-e-3' : 'dall-e-3',
      prompt: optimizedPrompt,
      n: 1,
      size: previewMode ? '1024x1024' : '1792x1024',
      quality: previewMode ? 'standard' : 'hd',
      style: 'natural',
    };

    console.log(`🤖 Generating image with prompt: ${optimizedPrompt}`);

    // Génération avec OpenAI
    const response = await openai.images.generate(generationOptions);
    const imageUrl = response.data[0].url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Télécharger l'image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Calculer le coût (approximatif)
    const costCents = calculateAICost(generationOptions);

    const processingTime = Date.now() - startTime;

    return {
      previewUrl: previewMode ? imageUrl : undefined,
      highResUrl: previewMode ? undefined : imageUrl,
      costCents,
      metadata: {
        model: generationOptions.model,
        promptTokens: Math.ceil(optimizedPrompt.length / 4), // Estimation
        completionTokens: 0,
        processingTimeMs: processingTime,
        provider: 'openai',
      },
    };

  } catch (error) {
    console.error('Error in AI generation:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Construction du prompt optimisé
 */
function buildOptimizedPrompt(prompt: string, product: any, options: any): string {
  const { font, position, material, finish } = options;

  let optimizedPrompt = `Professional product customization: ${prompt}`;

  // Ajouter les spécifications techniques
  if (font) {
    optimizedPrompt += `, ${font} font style`;
  }
  if (position) {
    optimizedPrompt += `, positioned at ${position}`;
  }
  if (material) {
    optimizedPrompt += `, ${material} material`;
  }
  if (finish) {
    optimizedPrompt += `, ${finish} finish`;
  }

  // Ajouter le contexte produit
  optimizedPrompt += `, ${product.name} product customization`;

  // Améliorer la qualité
  optimizedPrompt += ', high quality, professional, clean design, commercial use';

  return optimizedPrompt;
}

/**
 * Traitement post-génération des images
 */
async function processGeneratedImages(
  aiResult: AIGenerationResult,
  product: any,
  options: any
): Promise<{ previewUrl: string; highResUrl: string }> {
  const results: { previewUrl: string; highResUrl: string } = {
    previewUrl: '',
    highResUrl: '',
  };

  try {
    // Si on a une image haute résolution, créer une preview
    if (aiResult.highResUrl) {
      // Télécharger l'image haute résolution
      const highResResponse = await fetch(aiResult.highResUrl);
      const highResBuffer = Buffer.from(await highResResponse.arrayBuffer());

      // Créer une preview (redimensionnée)
      const previewBuffer = await sharp(highResBuffer)
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Upload vers Cloudinary
      const [previewResult, highResResult] = await Promise.all([
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'designs/previews' },
          (error, result) => {
            if (error) throw error;
            return result;
          }
        ).end(previewBuffer),
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'designs/highres' },
          (error, result) => {
            if (error) throw error;
            return result;
          }
        ).end(highResBuffer),
      ]);

      results.previewUrl = previewResult.secure_url;
      results.highResUrl = highResResult.secure_url;
    } else if (aiResult.previewUrl) {
      // Si on a seulement une preview
      const previewResponse = await fetch(aiResult.previewUrl);
      const previewBuffer = Buffer.from(await previewResponse.arrayBuffer());

      const previewResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'designs/previews' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(previewBuffer);
      });

      results.previewUrl = previewResult.secure_url;
    }

    return results;

  } catch (error) {
    console.error('Error processing images:', error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

/**
 * Calcul du coût IA
 */
function calculateAICost(options: any): number {
  // Coûts OpenAI DALL-E 3 (approximatifs)
  const costs = {
    '1024x1024': { standard: 0.04, hd: 0.08 },
    '1792x1024': { standard: 0.08, hd: 0.12 },
  };

  const size = options.size;
  const quality = options.quality;

  const costPerImage = costs[size]?.[quality] || 0.08;
  return Math.round(costPerImage * 100); // Convertir en centimes
}

/**
 * Enregistrement du coût IA
 */
async function recordAICost(brandId: string, costCents: number, designId: string): Promise<void> {
  try {
    await prisma.aICost.create({
      data: {
        brandId,
        designId,
        costCents,
        provider: 'openai',
        model: 'dall-e-3',
        timestamp: new Date(),
      },
    });

    // Mettre à jour l'agrégation des coûts par brand
    await prisma.$executeRaw`
      UPDATE "Brand" 
      SET "settings" = COALESCE("settings", '{}'::jsonb) || 
          jsonb_build_object('totalAICost', 
            COALESCE(("settings"->>'totalAICost')::int, 0) + ${costCents}
          )
      WHERE "id" = ${brandId}
    `;

  } catch (error) {
    console.error('Error recording AI cost:', error);
    // Ne pas faire échouer le job pour un problème de coût
  }
}

/**
 * Gestion des événements
 */
eventEmitter.on('design.completed', async (data) => {
  console.log('🎉 Design completed:', data);
  // Ici on pourrait déclencher des webhooks, notifications, etc.
});

eventEmitter.on('design.failed', async (data) => {
  console.log('💥 Design failed:', data);
  // Ici on pourrait déclencher des alertes, notifications d'erreur, etc.
});

/**
 * Gestion des signaux
 */
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down AI worker...');
  await worker.close();
  await redis.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down AI worker...');
  await worker.close();
  await redis.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🤖 AI Worker started successfully');
console.log(`📊 Processing jobs with concurrency: ${worker.opts.concurrency}`);
console.log(`🔗 Connected to Redis: ${process.env.REDIS_URL}`);
console.log(`🤖 OpenAI configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
console.log(`☁️ Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Yes' : 'No'}`);
