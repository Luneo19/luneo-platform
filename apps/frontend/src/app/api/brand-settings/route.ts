import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPatch } from '@/lib/backend-forward';

/**
 * GET /api/brand-settings
 * Récupère les paramètres de marque de l'utilisateur
 * Forward vers backend NestJS: GET /api/users/me puis GET /api/brands/:id
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Récupérer le profil utilisateur pour obtenir le brandId
    const userResult = await forwardGet('/users/me', request);
    const user = userResult.data as { brandId?: string | null };
    
    if (!user?.brandId) {
      // Pas de brand associé, retourner des valeurs par défaut
      return {
        brandSettings: {
          primary_color: '#000000',
          secondary_color: '#ffffff',
          logo_url: null,
          favicon_url: null,
          brand_name: null,
          brand_domain: null,
        },
        message: 'Paramètres de marque par défaut',
      };
    }

    // Récupérer les détails de la brand (qui contient les settings)
    const brandResult = await forwardGet(`/brands/${user.brandId}`, request);
    const brand = brandResult.data as { settings?: Record<string, unknown>; logo?: string; name?: string; website?: string } | null;

    // Extraire les settings de la brand ou retourner des valeurs par défaut
    const settings = brand?.settings || {};
    
    const s = settings as Record<string, unknown>;
    return {
      brandSettings: {
        primary_color: (s?.primary_color as string) || '#000000',
        secondary_color: (s?.secondary_color as string) || '#ffffff',
        logo_url: (s?.logo_url as string) ?? (brand?.logo as string) ?? null,
        favicon_url: (s?.favicon_url as string) ?? null,
        brand_name: brand?.name ?? null,
        brand_domain: brand?.website ?? null,
      },
    };
  }, '/api/brand-settings', 'GET');
}

/**
 * PUT /api/brand-settings
 * Met à jour les paramètres de marque de l'utilisateur
 * Forward vers backend NestJS: GET /api/users/me puis PATCH /api/brands/:id
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const {
      primary_color,
      secondary_color,
      logo_url,
      favicon_url,
      brand_name,
      brand_domain,
    } = body;

    // Validation des couleurs si fournies
    if (primary_color && !/^#[0-9A-F]{6}$/i.test(primary_color)) {
      throw {
        status: 400,
        message: 'Format de couleur primaire invalide (format hexadécimal requis: #RRGGBB)',
        code: 'VALIDATION_ERROR',
      };
    }

    if (secondary_color && !/^#[0-9A-F]{6}$/i.test(secondary_color)) {
      throw {
        status: 400,
        message: 'Format de couleur secondaire invalide (format hexadécimal requis: #RRGGBB)',
        code: 'VALIDATION_ERROR',
      };
    }

    // Validation du domaine si fourni
    if (brand_domain) {
      try {
        new URL(`https://${brand_domain}`);
      } catch {
        throw {
          status: 400,
          message: 'Format de domaine invalide',
          code: 'VALIDATION_ERROR',
        };
      }
    }

    // Récupérer le profil utilisateur pour obtenir le brandId
    const userResult = await forwardGet('/users/me', request);
    const user = userResult.data as { brandId?: string | null };
    
    if (!user?.brandId) {
      throw {
        status: 400,
        message: 'Aucune marque associée à votre compte',
        code: 'NO_BRAND',
      };
    }

    // Récupérer la brand actuelle pour préserver les settings existants
    const brandResult = await forwardGet(`/brands/${user.brandId}`, request);
    const currentBrand = brandResult.data as { settings?: Record<string, unknown> } | null;
    const currentSettings = (currentBrand?.settings as Record<string, unknown>) || {};

    // Mettre à jour les settings dans la brand
    const updatedSettings = {
      ...currentSettings,
      ...(primary_color && { primary_color }),
      ...(secondary_color && { secondary_color }),
      ...(logo_url !== undefined && { logo_url }),
      ...(favicon_url !== undefined && { favicon_url }),
    };

    // Mettre à jour la brand avec les nouveaux settings et autres champs
    const updateData: Record<string, unknown> = {
      settings: updatedSettings,
    };

    if (brand_name !== undefined) {
      updateData.name = brand_name;
    }
    if (brand_domain !== undefined) {
      updateData.website = brand_domain;
    }
    if (logo_url !== undefined) {
      updateData.logo = logo_url;
    }

    const result = await forwardPatch(`/brands/${user.brandId}`, request, updateData);
    const updatedBrand = result.data as { settings?: Record<string, unknown>; logo?: string; name?: string; website?: string } | null;

    const ubSettings = (updatedBrand?.settings ?? {}) as Record<string, unknown>;
    return {
      brandSettings: {
        primary_color: (ubSettings?.primary_color as string) || primary_color || '#000000',
        secondary_color: (ubSettings?.secondary_color as string) || secondary_color || '#ffffff',
        logo_url: (ubSettings?.logo_url as string) ?? (updatedBrand?.logo as string) ?? logo_url ?? null,
        favicon_url: (ubSettings?.favicon_url as string) ?? favicon_url ?? null,
        brand_name: updatedBrand?.name ?? brand_name ?? null,
        brand_domain: updatedBrand?.website ?? brand_domain ?? null,
      },
      message: 'Paramètres de marque mis à jour avec succès',
    };
  }, '/api/brand-settings', 'PUT');
}
