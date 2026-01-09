/**
 * API: Seller Connect Account
 * MK-008: Création et gestion des comptes Stripe Connect
 * Forward vers backend NestJS: POST /marketplace/seller/connect et GET /marketplace/seller/connect
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost, forwardGet } from '@/lib/backend-forward';

/**
 * POST /api/marketplace/seller/connect
 * Create a new Stripe Connect account for a seller
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const { country = 'FR', businessType = 'individual', businessName, firstName, lastName } = body;

    const result = await forwardPost('/marketplace/seller/connect', request, {
      country,
      businessType,
      businessName,
      firstName,
      lastName,
    });

    return result.data;
  }, '/api/marketplace/seller/connect', 'POST');
}

/**
 * GET /api/marketplace/seller/connect
 * Get seller's Connect account status
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/marketplace/seller/connect', request);

    return result.data;
  }, '/api/marketplace/seller/connect', 'GET');
}
