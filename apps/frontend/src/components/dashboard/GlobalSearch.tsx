'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useI18n } from '@/i18n/useI18n';

interface SearchResultItem {
  id: string;
  type: 'product' | 'design' | 'order';
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  url: string;
}

interface SearchResponse {
  results: {
    products: SearchResultItem[];
    designs: SearchResultItem[];
    orders: SearchResultItem[];
  };
  total: number;
}

const DEBOUNCE_MS = 300;

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&types=products,designs,orders`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }
      const json = await res.json();
      const payload = json?.data ?? json;
      setData(
        payload?.results
          ? { results: payload.results, total: payload.total ?? 0 }
          : { results: { products: [], designs: [], orders: [] }, total: 0 }
      );
    } catch (error) {
      logger.error('Global search failed', { error });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setData(null);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = open && (query.length >= 2) && (loading || (data && data.total > 0));
  const allItems: SearchResultItem[] = data
    ? [
        ...data.results.products,
        ...data.results.designs,
        ...data.results.orders,
      ]
    : [];

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-white/40 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t('header.searchPlaceholder')}
          className="dash-input w-full pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/40 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20"
          aria-label={t('header.searchPlaceholder')}
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-[min(400px,70vh)] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#1a1a2e] shadow-2xl backdrop-blur-xl z-[100]">
          {loading ? (
            <div className="p-4 text-center text-white/50 text-sm">{t('common.loading')}</div>
          ) : allItems.length === 0 ? (
            <div className="p-4 text-center text-white/50 text-sm">{t('common.noResults')}</div>
          ) : (
            <div className="py-2">
              {allItems.slice(0, 15).map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] transition-colors"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-9 w-9 rounded object-cover bg-white/5"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded bg-white/10 flex items-center justify-center text-white/40 text-xs font-medium">
                      {item.type === 'product' ? 'P' : item.type === 'design' ? 'D' : 'O'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white truncate">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-xs text-white/50 truncate">{item.subtitle}</div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase text-white/40">{item.type}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
