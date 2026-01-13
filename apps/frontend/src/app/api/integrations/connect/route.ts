import { NextRequest } from 'next/server';
import { ApiResponseBuilder, validateWithZodSchema } from '@/lib/api-response';
import { forwardPost, forwardDelete } from '@/lib/backend-forward';
import { connectIntegrationSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/integrations/connect
 * Connecte une intégration tierce
 * Forward vers backend NestJS selon le type:
 * - E-commerce (shopify, woocommerce): POST /api/ecommerce/{service}/connect
 * - Générales (slack, zapier, webhook): POST /api/integrations/{type}/enable
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(connectIntegrationSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      service: 'shopify' | 'woocommerce' | 'stripe' | 'sendgrid' | 'cloudinary' | 'slack' | 'zapier' | 'webhook';
      credentials: Record<string, any>;
      config?: Record<string, any>;
    };
    const { service, credentials, config } = validatedData;

    // Router vers le bon endpoint backend selon le type d'intégration
    if (service === 'shopify' || service === 'woocommerce') {
      // Intégrations e-commerce
      const result = await forwardPost(`/ecommerce/${service}/connect`, request, {
        ...credentials,
        ...config,
      });
      return {
        integration: result.data,
        message: `Intégration ${service} connectée avec succès`,
      };
    } else if (service === 'slack' || service === 'zapier' || service === 'webhook') {
      // Intégrations générales
      const result = await forwardPost(`/integrations/${service}/enable`, request, {
        ...credentials,
        ...config,
      });
      return {
        integration: result.data,
        message: `Intégration ${service} activée avec succès`,
      };
    } else {
      // Autres intégrations (stripe, sendgrid, cloudinary) - TODO: Implémenter dans le backend
      throw {
        status: 501,
        message: `Route POST /integrations/connect pour ${service} pas encore implémentée dans le backend`,
        code: 'NOT_IMPLEMENTED',
      };
    }
  }, '/api/integrations/connect', 'POST');
}

/**
 * DELETE /api/integrations/connect?service=xxx
 * Déconnecte une intégration
 * Forward vers backend NestJS selon le type:
 * - E-commerce (shopify, woocommerce): DELETE /api/ecommerce/{service} (si disponible)
 * - Générales (slack, zapier, webhook): DELETE /api/integrations/{type}
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (!service) {
      throw {
        status: 400,
        message: 'Le paramètre service est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Router vers le bon endpoint backend selon le type d'intégration
    if (service === 'shopify' || service === 'woocommerce') {
      // Intégrations e-commerce - nécessite integrationId
      const integrationId = searchParams.get('integrationId');
      if (!integrationId) {
        throw {
          status: 400,
          message: 'Le paramètre integrationId est requis pour déconnecter une intégration e-commerce',
          code: 'VALIDATION_ERROR',
        };
      }
      const result = await forwardDelete(`/ecommerce/integrations/${integrationId}`, request);
      return {
        message: `Intégration ${service} déconnectée avec succès`,
        ...((result.data as Record<string, any>) || {}),
      };
    } else if (service === 'slack' || service === 'zapier' || service === 'webhook') {
      // Intégrations générales
      const result = await forwardDelete(`/integrations/${service}`, request);
      return {
        message: `Intégration ${service} déconnectée avec succès`,
        ...((result.data as Record<string, any>) || {}),
      };
    } else {
      throw {
        status: 501,
        message: `Route DELETE /integrations/connect pour ${service} pas encore implémentée dans le backend`,
        code: 'NOT_IMPLEMENTED',
      };
    }
  }, '/api/integrations/connect', 'DELETE');
}
