import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPatch } from '@/lib/backend-forward';

/**
 * GET /api/settings/profile
 * Récupère le profil de l'utilisateur
 * Forward vers backend NestJS: GET /api/users/me (même route que /api/profile)
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/users/me', _request);
    return { profile: result.data };
  }, '/api/settings/profile', 'GET');
}

/**
 * PUT /api/settings/profile
 * Met à jour le profil de l'utilisateur
 * Forward vers backend NestJS: PATCH /api/users/me (même route que /api/profile)
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const { name, company, phone, website, timezone } = body;

    // Validation
    if (name !== undefined && (!name || name.trim().length === 0)) {
      throw {
        status: 400,
        message: 'Le nom ne peut pas être vide',
        code: 'VALIDATION_ERROR',
      };
    }

    // Validation URL si fournie
    if (website && website.trim()) {
      try {
        new URL(website);
      } catch {
        throw {
          status: 400,
          message: 'Format d\'URL invalide',
          code: 'VALIDATION_ERROR',
        };
      }
    }

    // Préparer les données pour le backend
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.firstName = name.trim();
    if (company !== undefined) updateData.company = company.trim();
    if (phone !== undefined || website !== undefined || timezone !== undefined) {
      updateData.metadata = {
        ...(body.metadata || {}),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(website !== undefined && { website: website.trim() }),
        ...(timezone !== undefined && { timezone }),
      };
    }

    const result = await forwardPatch('/users/me', request, updateData);
    return {
      profile: result.data,
      message: 'Profil mis à jour avec succès',
    };
  }, '/api/settings/profile', 'PUT');
}
