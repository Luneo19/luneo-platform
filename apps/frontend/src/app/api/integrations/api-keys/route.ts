import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createApiKeySchema } from '@/lib/validation/zod-schemas';
import crypto from 'crypto';

/**
 * GET /api/integrations/api-keys
 * Récupère toutes les clés API de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('id, name, is_active, created_at, last_used_at, usage_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (apiKeysError) {
      logger.dbError('fetch api keys', apiKeysError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des clés API' };
    }

    // Ne pas exposer les clés complètes, seulement les préfixes
    const sanitizedKeys = (apiKeys || []).map((key: any) => ({
      ...key,
      key_prefix: key.key?.substring(0, 8) + '...' || null,
      key: undefined, // Ne pas exposer la clé complète
    }));

    return { apiKeys: sanitizedKeys };
  }, '/api/integrations/api-keys', 'GET');
}

/**
 * POST /api/integrations/api-keys
 * Crée une nouvelle clé API
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = createApiKeySchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { name, permissions = [] } = validation.data;

    // Vérifier la limite de clés API par utilisateur
    const { count: existingKeysCount, error: countError } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (countError) {
      logger.dbError('count api keys', countError, { userId: user.id });
    }

    const maxKeys = 10; // Limite de 10 clés API actives par utilisateur
    if ((existingKeysCount || 0) >= maxKeys) {
      throw {
        status: 429,
        message: `Limite de ${maxKeys} clés API actives atteinte`,
        code: 'API_KEY_LIMIT_EXCEEDED',
      };
    }

    // Générer une clé API sécurisée
    const apiKey = `luneo_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Créer la clé API
    const { data: createdKey, error: createError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: name.trim(),
        key_hash: hashedKey,
        permissions: Array.isArray(permissions) ? permissions : [],
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      logger.dbError('create api key', createError, {
        userId: user.id,
        keyName: name,
      });
      throw { status: 500, message: 'Erreur lors de la création de la clé API' };
    }

    logger.info('API key created', {
      userId: user.id,
      apiKeyId: createdKey.id,
      keyName: name,
    });

    // Retourner la clé complète UNIQUEMENT lors de la création
    return {
      apiKey: {
        ...createdKey,
        key: apiKey, // Exposer la clé complète uniquement à la création
        key_hash: undefined, // Ne pas exposer le hash
      },
      message: 'Clé API créée avec succès. Veuillez la sauvegarder, elle ne sera plus affichée.',
    };
  }, '/api/integrations/api-keys', 'POST');
}
