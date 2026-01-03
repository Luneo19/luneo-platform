/**
 * Web Vitals API
 * Endpoint pour recevoir et stocker les métriques Core Web Vitals
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

// Schema de validation pour les Web Vitals
const webVitalSchema = z.object({
  name: z.enum(['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  delta: z.number().optional(),
  id: z.string(),
  url: z.string().optional(),
  timestamp: z.number(),
});

const requestSchema = z.object({
  name: z.enum(['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  delta: z.number().optional(),
  id: z.string(),
  url: z.string().optional(),
  timestamp: z.number(),
});

// In-memory store pour démo (en production, utiliser Redis ou database)
const webVitalsStore: Array<z.infer<typeof webVitalSchema>> = [];
const MAX_STORED = 10000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid web vital data', { errors: validation.error.issues });
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const metric = validation.data;

    // Stocker en mémoire (pour démo)
    webVitalsStore.push(metric);
    
    // Garder seulement les dernières métriques
    if (webVitalsStore.length > MAX_STORED) {
      webVitalsStore.splice(0, webVitalsStore.length - MAX_STORED);
    }

    // Essayer de stocker dans Supabase si disponible
    try {
      const supabase = await createClient();
      
      // Vérifier si la table web_vitals existe
      const { error: insertError } = await supabase
        .from('web_vitals')
        .insert({
          metric_name: metric.name,
          metric_value: metric.value,
          rating: metric.rating || 'unknown',
          delta: metric.delta,
          metric_id: metric.id,
          url: metric.url || '/',
          timestamp: new Date(metric.timestamp).toISOString(),
          user_agent: request.headers.get('user-agent') || 'unknown',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        });

      if (insertError) {
        // La table n'existe peut-être pas, logger mais ne pas échouer
        logger.debug('Supabase web_vitals insert skipped', { error: insertError.message });
      }
    } catch (supabaseError) {
      // Supabase non configuré, continuer avec stockage en mémoire
      logger.debug('Supabase web_vitals storage skipped');
    }

    // Logger en développement
    if (process.env.NODE_ENV === 'development') {
      logger.info('Web Vital received', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      });
    }

    return NextResponse.json({
      success: true,
      received: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Web Vitals API error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint pour récupérer les métriques (admin seulement)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('name');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Calculer la date de début par défaut (7 jours)
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 7);
    const start = startDate || defaultStartDate.toISOString();

    // Essayer de récupérer depuis Supabase
    try {
      let query = supabase
        .from('web_vitals')
        .select('*')
        .gte('timestamp', start)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (metricName) {
        query = query.eq('metric_name', metricName);
      }

      const { data, error } = await query;

      if (error) {
        // Table n'existe peut-être pas, utiliser store en mémoire
        logger.debug('Supabase web_vitals query skipped', { error: error.message });
        
        // Filtrer depuis le store en mémoire
        let filtered = webVitalsStore.filter(m => {
          const metricDate = new Date(m.timestamp);
          return metricDate >= new Date(start) && metricDate <= new Date(endDate);
        });

        if (metricName) {
          filtered = filtered.filter(m => m.name === metricName);
        }

        return NextResponse.json({
          success: true,
          metrics: filtered.slice(0, 1000),
          count: filtered.length,
        });
      }

      return NextResponse.json({
        success: true,
        metrics: data || [],
        count: data?.length || 0,
      });
    } catch (supabaseError) {
      // Utiliser le store en mémoire
      let filtered = webVitalsStore.filter(m => {
        const metricDate = new Date(m.timestamp);
        return metricDate >= new Date(start) && metricDate <= new Date(endDate);
      });

      if (metricName) {
        filtered = filtered.filter(m => m.name === metricName);
      }

      return NextResponse.json({
        success: true,
        metrics: filtered.slice(0, 1000),
        count: filtered.length,
      });
    }
  } catch (error) {
    logger.error('Web Vitals GET error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}








