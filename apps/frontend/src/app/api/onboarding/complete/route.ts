import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { getBackendUrl } from '@/lib/api/server-url';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';

const API_URL = getBackendUrl();

/**
 * POST /api/onboarding/complete
 * Saves all onboarding steps then marks onboarding as completed.
 * Forwards to backend: POST /api/v1/onboarding/step/1..5 then POST .../complete.
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json().catch(() => ({}));
    const {
      brandName,
      logoUrl,
      industry,
      objectives,
      firstProduct,
    } = body as {
      brandName?: string;
      logoUrl?: string;
      industry?: string;
      objectives?: string[];
      firstProduct?: { name?: string; image?: string } | null;
    };

    const cookieHeader = request.headers.get('cookie') || '';

    // Map wizard industry to backend Industry slug (seed has: jewelry, eyewear, fashion, other, etc.)
    const industrySlugMap: Record<string, string> = {
      jewelry: 'jewelry',
      watches: 'other',
      glasses: 'eyewear',
      accessories: 'fashion',
      other: 'other',
    };
    const industrySlug = industry ? industrySlugMap[industry] ?? industry : undefined;

    async function backendFetch(path: string, method: 'GET' | 'POST', data?: object) {
      const res = await fetch(`${API_URL}/api/v1/onboarding${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        ...(data !== undefined && { body: JSON.stringify(data) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `Backend ${path} failed`);
      }
      return res.json();
    }

    try {
      // Step 1: brand/company name (creates org if needed)
      await backendFetch('/step/1', 'POST', {
        stepNumber: 1,
        data: {
          companyName: brandName || '',
          name: brandName || '',
        },
      });

      // Step 2: industry (slug must exist in backend Industry table)
      if (industrySlug) {
        await backendFetch('/step/2', 'POST', {
          stepNumber: 2,
          data: { industrySlug, industry: industrySlug },
        });
      }

      // Step 3: objectives / use cases
      await backendFetch('/step/3', 'POST', {
        stepNumber: 3,
        data: { objectives: objectives || [] },
      });

      // Step 4: first product (optional)
      await backendFetch('/step/4', 'POST', {
        stepNumber: 4,
        data: { firstProduct: firstProduct || null },
      });

      // Step 5: placeholder
      await backendFetch('/step/5', 'POST', { stepNumber: 5, data: {} });

      // Mark onboarding complete
      await backendFetch('/complete', 'POST');
    } catch (err) {
      serverLogger.error('Onboarding complete failed', { error: err, userId: user.id });
      throw {
        status: 500,
        message: err instanceof Error ? err.message : 'Erreur lors de la configuration',
        code: 'ONBOARDING_COMPLETE_ERROR',
      };
    }

    return ApiResponseBuilder.success({ completed: true });
  }, '/api/onboarding/complete', 'POST');
}
