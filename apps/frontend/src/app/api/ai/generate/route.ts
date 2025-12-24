import { hashPrompt, maskPromptForLogs, sanitizePrompt } from '@/lib/ai-safety';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { aiGenerateRateLimit, checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { generateAISchema } from '@/lib/validation/zod-schemas';
import { v2 as cloudinary } from 'cloudinary';
import OpenAI from 'openai';

// Configuration OpenAI (lazy init pour éviter erreur au build)
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
    });
  }
  return openai;
}

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/ai/generate
 * Génère un design avec DALL-E 3
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const startTime = Date.now();
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting (10 générations par heure)
    let remainingAttempts: number | null = null;
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const identifier = getClientIdentifier(request, user.id);
      const { success, remaining, reset } = await checkRateLimit(identifier, aiGenerateRateLimit);
      remainingAttempts = remaining;

      if (!success) {
        throw {
          status: 429,
          message: `Limite de génération atteinte. Réessayez après ${reset.toLocaleTimeString()}.`,
          code: 'RATE_LIMIT_EXCEEDED',
          remaining: 0,
          reset: reset.toISOString(),
        };
      }
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = generateAISchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = validation.data;

    // Vérifier les crédits IA (PRIORITÉ ABSOLUE)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, ai_credits, metadata')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.dbError('fetch user profile for credits', profileError, { userId: user.id });
    }

    // Récupérer balance crédits (support colonnes directes ou metadata)
    const creditsBalance = profile?.ai_credits ?? profile?.metadata?.aiCredits ?? 0;
    const creditsRequired = size === '1024x1024' ? 5 : size === '1792x1024' || size === '1024x1792' ? 7 : 5;
    const qualityMultiplier = quality === 'hd' ? 2 : 1;
    const totalCreditsRequired = creditsRequired * qualityMultiplier;

    if (creditsBalance < totalCreditsRequired) {
      // Récupérer packs disponibles pour upsell
      const packsResponse = await fetch(`${request.url.split('/api')[0]}/api/credits/packs`);
      const packsData = await packsResponse.json().catch(() => ({ packs: [] }));

      throw {
        status: 402,
        message: `Crédits insuffisants. Vous avez ${creditsBalance} crédits, ${totalCreditsRequired} requis.`,
        code: 'INSUFFICIENT_CREDITS',
        balance: creditsBalance,
        required: totalCreditsRequired,
        packs: packsData.packs || [],
      };
    }

    const { count: monthlyUsage, error: usageError } = await supabase
      .from('designs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(new Date().setDate(1)).toISOString());

    if (usageError) {
      logger.dbError('fetch monthly design usage', usageError, { userId: user.id });
    }

    // Limites par plan
    const limits: Record<string, number> = {
      starter: 5,
      professional: 50,
      enterprise: 999999,
    };

    const userLimit = limits[profile?.subscription_tier || 'starter'] || 5;

    if ((monthlyUsage || 0) >= userLimit) {
      throw {
        status: 429,
        message: `Limite mensuelle atteinte (${userLimit} designs/${profile?.subscription_tier || 'starter'})`,
        code: 'QUOTA_EXCEEDED',
        quota_exceeded: true,
        limit: userLimit,
        used: monthlyUsage || 0,
      };
    }

    // Sanitizer le prompt
    const sanitizedPrompt = sanitizePrompt(prompt, { maxLength: 1200 });

    if (sanitizedPrompt.blocked) {
      logger.warn('Blocked prompt detected', {
        userId: user.id,
        reasons: sanitizedPrompt.reasons,
      });
      throw {
        status: 400,
        message: 'Prompt rejeté: informations sensibles détectées',
        code: 'PROMPT_BLOCKED',
        reasons: sanitizedPrompt.reasons,
      };
    }

    const promptHash = hashPrompt(prompt);
    const safePrompt = sanitizedPrompt.prompt;

    logger.info('DALL-E 3 generation started', {
      userId: user.id,
      promptHash,
      maskedPrompt: maskPromptForLogs(safePrompt),
      size,
      quality,
      style,
    });

    // Vérifier la clé API
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
      logger.error('OpenAI API key not configured', new Error('Missing OPENAI_API_KEY'));
      throw {
        status: 500,
        message: 'OpenAI API key non configurée',
        code: 'CONFIGURATION_ERROR',
      };
    }

    // Générer l'image avec DALL-E 3
    let imageUrl: string;
    let revisedPrompt: string | undefined;

    try {
      const openaiClient = getOpenAI();
      const response = await openaiClient.images.generate({
        model: 'dall-e-3',
        prompt: safePrompt,
        size: size as '1024x1024' | '1792x1024' | '1024x1792',
        quality: quality as 'standard' | 'hd',
        style: style as 'vivid' | 'natural',
        n: 1,
      });

      imageUrl = response.data?.[0]?.url || '';
      revisedPrompt = response.data?.[0]?.revised_prompt;

      if (!imageUrl) {
        throw new Error('Aucune image générée par DALL-E 3');
      }
    } catch (openaiError: any) {
      logger.error('OpenAI API error', openaiError, {
        userId: user.id,
        promptHash,
      });

      if (openaiError.status === 429) {
        throw {
          status: 429,
          message: 'Limite OpenAI atteinte. Réessayez plus tard.',
          code: 'OPENAI_RATE_LIMIT',
        };
      }

      throw {
        status: 500,
        message: `Erreur lors de la génération: ${openaiError.message || 'Erreur inconnue'}`,
        code: 'OPENAI_ERROR',
      };
    }

    // Upload vers Cloudinary
    let cloudinaryUrl: string;
    try {
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'luneo/designs',
        public_id: `${user.id}/${promptHash}`,
        overwrite: true,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto',
      });

      cloudinaryUrl = uploadResult.secure_url;
    } catch (cloudinaryError: any) {
      logger.error('Cloudinary upload error', cloudinaryError, {
        userId: user.id,
        promptHash,
      });
      // Fallback sur l'URL OpenAI si Cloudinary échoue
      cloudinaryUrl = imageUrl;
      logger.warn('Using OpenAI URL as fallback', { userId: user.id });
    }

    // Sauvegarder le design dans la base de données
    const { data: design, error: designError } = await supabase
      .from('designs')
      .insert({
        user_id: user.id,
        prompt: safePrompt,
        revised_prompt: revisedPrompt,
        preview_url: cloudinaryUrl,
        original_url: imageUrl,
        status: 'completed',
        metadata: {
          size,
          quality,
          style,
          prompt_hash: promptHash,
          generation_time_ms: Date.now() - startTime,
          source: 'dall-e-3',
        },
      })
      .select()
      .single();

    if (designError) {
      logger.dbError('save generated design', designError, {
        userId: user.id,
        promptHash,
      });
      // Ne pas échouer complètement si la sauvegarde échoue, l'image est déjà générée
      logger.warn('Design generated but failed to save', {
        userId: user.id,
        imageUrl: cloudinaryUrl,
      });
    }

    // Déduire les crédits IA (après génération réussie)
    try {
      const newBalance = creditsBalance - totalCreditsRequired;
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Si colonnes existent, les utiliser
      if (profile?.ai_credits !== undefined) {
        updateData.ai_credits = Math.max(0, newBalance);
        updateData.ai_credits_used = (profile.metadata?.aiCreditsUsed || 0) + totalCreditsRequired;
      } else {
        // Sinon, stocker dans metadata
        updateData.metadata = {
          ...(profile?.metadata || {}),
          aiCredits: Math.max(0, newBalance),
          aiCreditsUsed: (profile?.metadata?.aiCreditsUsed || 0) + totalCreditsRequired,
        };
      }

      const { error: creditsError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (creditsError) {
        logger.error('Failed to deduct credits', {
          error: creditsError,
          userId: user.id,
          creditsDeducted: totalCreditsRequired,
        });
        // Ne pas échouer la génération si la déduction échoue
      } else {
        logger.info('Credits deducted successfully', {
          userId: user.id,
          creditsBefore: creditsBalance,
          creditsDeducted: totalCreditsRequired,
          creditsAfter: newBalance,
        });
      }
    } catch (creditsError: any) {
      logger.error('Error deducting credits', creditsError, {
        userId: user.id,
      });
      // Ne pas échouer la génération si la déduction échoue
    }

    const duration = Date.now() - startTime;

    logger.info('DALL-E 3 generation completed', {
      userId: user.id,
      designId: design?.id,
      promptHash,
      duration,
      remainingAttempts,
    });

    return ApiResponseBuilder.success({
      design: design || {
        id: null,
        preview_url: cloudinaryUrl,
        original_url: imageUrl,
        prompt: safePrompt,
        revised_prompt: revisedPrompt,
      },
      images: [{ url: cloudinaryUrl }],
      imageUrl: cloudinaryUrl,
      revisedPrompt,
      duration_ms: duration,
      remaining: remainingAttempts,
    });
  }, '/api/ai/generate', 'POST');
}
