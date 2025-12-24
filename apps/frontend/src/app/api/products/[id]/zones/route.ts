/**
 * ★★★ API ROUTE - ZONES PRODUIT ★★★
 * API route pour gérer les zones d'un produit
 * - GET: Récupère les zones
 * - PUT: Met à jour les zones
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';
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

// ========================================
// GET - Récupère les zones
// ========================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiResponseBuilder.handle(async () => {
    const productId = params.id;

    logger.info('Fetching zones', { productId });

    const zones = await db.zone.findMany({
      where: {
        productId,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    return ApiResponseBuilder.success(zones);
  }, '/api/products/[id]/zones', 'GET');
}

// ========================================
// PUT - Met à jour les zones
// ========================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiResponseBuilder.handle(async () => {
    const productId = params.id;
    const body = await request.json();

    // Validation
    const validatedZones = UpdateZonesSchema.parse(body);

    logger.info('Updating zones', { productId, count: validatedZones.length });

    // Transaction pour mettre à jour toutes les zones
    const result = await db.$transaction(async (tx) => {
      // Supprime les zones existantes
      await tx.zone.deleteMany({
        where: { productId },
      });

      // Crée les nouvelles zones
      const createdZones = await Promise.all(
        validatedZones.map((zone) =>
          tx.zone.create({
            data: {
              ...zone,
              productId,
            },
          })
        )
      );

      return createdZones;
    });

    return ApiResponseBuilder.success(result);
  }, '/api/products/[id]/zones', 'PUT');
}
