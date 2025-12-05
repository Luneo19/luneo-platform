import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/bracelet/customizations
 * 
 * Enregistre une personnalisation de bracelet
 * 
 * @body {
 *   text: string;
 *   font: string;
 *   fontSize: number;
 *   alignment: string;
 *   position: string;
 *   color: string;
 *   material: string;
 *   texture?: string; // base64 data URL
 *   model: string;
 * }
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return ApiResponseBuilder.unauthorized('Non authentifié');
    }

    const body = await request.json();
    const {
      text,
      font,
      fontSize,
      alignment,
      position,
      color,
      material,
      texture,
      model,
    } = body;

    // Validation
    if (!text || text.length > 50) {
      return ApiResponseBuilder.badRequest('Le texte doit contenir entre 1 et 50 caractères');
    }

    if (!font || !fontSize || !alignment || !position || !color || !material) {
      return ApiResponseBuilder.badRequest('Tous les paramètres sont requis');
    }

    const id = uuidv4();
    const customization = {
      id,
      userId: user.id,
      text,
      font,
      fontSize,
      alignment,
      position,
      color,
      material,
      model: model || 'bracelet.glb',
      texture,
      createdAt: new Date().toISOString(),
    };

    // Save to database (or file system for MVP)
    // TODO: Replace with actual database storage
    logger.info('Bracelet customization saved', { id, userId: user.id });

    return {
      id,
      customization,
      message: 'Personnalisation enregistrée avec succès',
    };
  }, '/api/bracelet/customizations', 'POST');
}

/**
 * GET /api/bracelet/customizations
 * 
 * Récupère les personnalisations de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return ApiResponseBuilder.unauthorized('Non authentifié');
    }

    // TODO: Fetch from database
    const customizations = [];

    return {
      customizations,
      count: customizations.length,
    };
  }, '/api/bracelet/customizations', 'GET');
}

