import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';

/**
 * GET /api/bracelet/models
 * 
 * Liste les modèles de bracelet disponibles
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const models = [
      {
        id: 'bracelet-classic',
        name: 'Bracelet Classique',
        description: 'Bracelet classique avec gravure personnalisable',
        modelUrl: '/models/bracelets/bracelet.glb',
        usdzUrl: '/models/bracelets/bracelet.usdz',
        thumbnail: '/models/bracelets/bracelet-thumb.jpg',
        engravingAreas: [
          {
            id: 'exterior',
            name: 'Extérieur',
            position: { x: 0, y: 0, z: 0 },
            size: { width: 50, height: 10 },
          },
          {
            id: 'interior',
            name: 'Intérieur',
            position: { x: 0, y: 0, z: -0.5 },
            size: { width: 50, height: 10 },
          },
        ],
      },
    ];

    return {
      models,
      count: models.length,
    };
  }, '/api/bracelet/models', 'GET');
}

