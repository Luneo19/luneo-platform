'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { logger } from '@/lib/logger';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ShareData {
  shareToken: string;
  image: string | null;
  thumbnail: string | null;
  product: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  brand: {
    name: string;
    slug: string;
    logo: string | null;
  };
  productType: string;
  tryOnUrl: string | null;
  viewCount: number;
}

export default function TryOnSharePage() {
  const params = useParams();
  const shareToken = params?.shareToken as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/public/try-on/shares/${encodeURIComponent(shareToken)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        if (mounted) {
          setError('Ce lien de partage est invalide ou a expire.');
          logger.error('Share page load failed', { shareToken, error: err });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [shareToken]);

  const handleTryOnClick = async () => {
    try {
      await fetch(
        `${API_BASE}/api/v1/public/try-on/shares/${encodeURIComponent(shareToken)}/click`,
        { method: 'POST' },
      );
    } catch {
      // Ignore tracking errors
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-3 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center text-white">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-4">&#128566;</div>
          <h1 className="text-xl font-semibold mb-2">Lien expire</h1>
          <p className="text-gray-400">{error || 'Ce lien n\'est plus disponible.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 text-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          {data.brand.logo && (
            <Image
              src={data.brand.logo}
              alt={data.brand.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <span className="font-semibold text-sm">{data.brand.name}</span>
        </div>
        <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
          Virtual Try-On
        </span>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-6 py-8">
        {/* Screenshot image */}
        {data.image && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-2xl shadow-purple-500/20">
            <Image
              src={data.image}
              alt={data.product?.name || 'Virtual Try-On'}
              width={600}
              height={600}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Product info */}
        {data.product && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">{data.product.name}</h1>
            <p className="text-gray-400 text-sm">
              par {data.brand.name}
            </p>
          </div>
        )}

        {/* CTA buttons */}
        <div className="space-y-3">
          {data.tryOnUrl && (
            <Link
              href={data.tryOnUrl}
              onClick={handleTryOnClick}
              className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors"
            >
              Essayez aussi
            </Link>
          )}

          {data.product && (
            <button
              onClick={handleTryOnClick}
              className="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Voir le produit
            </button>
          )}
        </div>

        {/* Social proof */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            {data.viewCount > 1
              ? `${data.viewCount.toLocaleString()} personnes ont vu ce look`
              : 'Soyez le premier a essayer !'}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/5">
        <p className="text-gray-600 text-xs">
          Powered by Luneo - Virtual Try-On
        </p>
      </footer>
    </div>
  );
}
