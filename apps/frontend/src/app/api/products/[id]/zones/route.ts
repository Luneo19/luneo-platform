/**
 * GET/PUT /api/products/[id]/zones
 * Gère les zones d'un produit
 * Forward vers backend NestJS: GET/PUT /product-engine/products/:id/zones
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut } from '@/lib/backend-forward';
import { z } from 'zod';

// ========================================
// SCHEMAS
// ========================================

const UpdateZonesSchema = z.array(
  z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(['TEXT', 'IMAGE', 'PATTERN', 'COLOR']),
    positionX: z.number(),
    positionY: z.number(),
    positionZ: z.number(),
    uvMinU: z.number().min(0).max(1),
    uvMaxU: z.number().min(0).max(1),
    uvMinV: z.number().min(0).max(1),
    uvMaxV: z.number().min(0).max(1),
    maxChars: z.number().optional(),
    allowedFonts: z.array(z.string()).optional(),
    defaultFont: z.string().optional(),
    defaultColor: z.string().optional(),
    defaultSize: z.number().optional(),
    isRequired: z.boolean().default(false),
    order: z.number().default(0),
  })
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiResponseBuilder.handle(async () => {
    const productId = params.id;

    const result = await forwardGet(`/product-engine/products/${productId}/zones`, request);
    return result.data;
  }, '/api/products/[id]/zones', 'GET');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiResponseBuilder.handle(async () => {
    const productId = params.id;
    const body = await request.json();

    // Validation
    const validatedZones = UpdateZonesSchema.parse(body);

    // Forward vers le backend - le backend gère la mise à jour de toutes les zones
    const result = await forwardPut(`/product-engine/products/${productId}/zones`, request, validatedZones);
    return result.data;
  }, '/api/products/[id]/zones', 'PUT');
}
