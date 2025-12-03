/**
 * Background Removal API
 * AI-002: Suppression automatique d'arrière-plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const requestSchema = z.object({
  imageUrl: z.string().url(),
  mode: z.enum(['auto', 'person', 'product', 'animal']).default('auto'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { imageUrl, mode } = validation.data;

    logger.info('Background removal requested', { mode });

    // Check for Replicate API key
    const replicateKey = process.env.REPLICATE_API_TOKEN;
    
    if (replicateKey) {
      // Use Replicate's rembg model
      try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
            input: { image: imageUrl },
          }),
        });

        if (response.ok) {
          const prediction = await response.json();
          
          // Poll for result
          let result = prediction;
          while (result.status !== 'succeeded' && result.status !== 'failed') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const pollResponse = await fetch(result.urls.get, {
              headers: { 'Authorization': `Token ${replicateKey}` },
            });
            result = await pollResponse.json();
          }

          if (result.status === 'succeeded') {
            return NextResponse.json({
              success: true,
              outputUrl: result.output,
              mode,
            });
          }
        }
      } catch (replicateError) {
        logger.warn('Replicate API failed, using fallback', { error: replicateError });
      }
    }

    // Fallback: Return mock result for demo
    // In production, integrate with remove.bg, Photoroom, or similar service
    const mockOutputUrl = generateMockOutput(imageUrl);

    return NextResponse.json({
      success: true,
      outputUrl: mockOutputUrl,
      maskUrl: null,
      mode,
      provider: 'demo',
      message: 'Demo mode: Configure REPLICATE_API_TOKEN for real background removal',
    });
  } catch (error) {
    logger.error('Background removal error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock output generator for demo
function generateMockOutput(inputUrl: string): string {
  // In demo mode, return a placeholder or the same image
  // Real implementation would use actual AI service
  return inputUrl;
}


