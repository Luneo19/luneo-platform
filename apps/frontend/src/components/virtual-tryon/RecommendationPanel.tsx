'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { logger } from '@/lib/logger';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface RecommendedProduct {
  id: string;
  name: string;
  image: string | null;
  score: number;
  reason: string;
}

interface RecommendationPanelProps {
  sessionId: string | null;
  currentProductId?: string | null;
  onSelectProduct?: (productId: string) => void;
  className?: string;
}

/**
 * RecommendationPanel - Displays AI-powered product recommendations
 * during a Virtual Try-On session.
 *
 * Updates when the current product changes.
 */
export default function RecommendationPanel({
  sessionId,
  currentProductId,
  onSelectProduct,
  className,
}: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentProductId) params.set('currentProductId', currentProductId);
      params.set('limit', '5');

      const res = await fetch(
        `${API_BASE}/api/v1/public/try-on/sessions/${encodeURIComponent(sessionId)}/recommendations?${params}`,
      );

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      logger.warn('Failed to fetch recommendations', { error: err });
    } finally {
      setLoading(false);
    }
  }, [sessionId, currentProductId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (!sessionId || (recommendations.length === 0 && !loading)) {
    return null;
  }

  return (
    <div className={`${className || ''}`}>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        Vous pourriez aimer
      </h4>

      {loading && recommendations.length === 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-20 h-24 bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {recommendations.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelectProduct?.(product.id)}
              className="flex-shrink-0 w-20 group"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 mb-1">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <span className="text-2xl">&#128142;</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/20 transition-colors" />
              </div>
              <p className="text-xs text-gray-300 truncate text-center group-hover:text-white transition-colors">
                {product.name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
